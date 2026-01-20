// Feature #262: Reminder timing with timezone support
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from './middleware/auth.js';
import { DecisionService } from './services/decisionServiceNew.js';
import { AsyncVoiceService } from './services/asyncVoiceService.js';
import { jobManager } from './services/jobManager.js';
import { InsightsService } from './services/insightsService.js';

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from monorepo root
config({ path: path.resolve(__dirname, '../../../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Regular auth client for password verification
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register plugins
async function registerPlugins() {
  // CORS
  await server.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : true,
    credentials: true,
  });

  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: false, // Configure properly in production
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Multipart file upload
  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
  });
}

// Helper functions for quiet hours
function parseTimeString(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function isInQuietHours(currentTimeStr: string, quietStart: string, quietEnd: string): boolean {
  const currentMinutes = parseTimeString(currentTimeStr);
  const startMinutes = parseTimeString(quietStart);
  const endMinutes = parseTimeString(quietEnd);

  if (endMinutes < startMinutes) {
    // Quiet hours span midnight (e.g., 22:00 to 08:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Quiet hours within same day (e.g., 01:00 to 05:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

function getTodayTimeAt(timeStr: string, timezone: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();

  // Create a date for today at the specified time in the user's timezone
  const result = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  result.setHours(hours, minutes, 0, 0);

  return result;
}

// Register routes
async function registerRoutes() {
  // Health check (public)
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API version prefix
  server.register(async (api) => {
    // Apply auth middleware to all routes in this scope
    api.addHook('preHandler', authMiddleware);

    // Decisions endpoints
    api.get('/decisions', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const query = request.query as any;
        const result = await DecisionService.getDecisions(userId, {
          status: query.status,
          categoryId: query.categoryId,
          search: query.search,
          limit: query.limit ? parseInt(query.limit) : 20,
          offset: query.offset ? parseInt(query.offset) : 0,
          cursor: query.cursor, // Feature #267: cursor-based pagination
        });

        return result;
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.get('/decisions/trash', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const query = request.query as any;
        const result = await DecisionService.getDeletedDecisions(userId, {
          search: query.search,
          limit: query.limit ? parseInt(query.limit) : 20,
          offset: query.offset ? parseInt(query.offset) : 0,
        });

        return result;
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.get('/decisions/stats', async (request, reply) => {
      try {
        console.log('Stats endpoint called');
        const userId = request.user?.id;
        console.log('User ID:', userId);

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        console.log('Calling DecisionService.getStatistics');
        const stats = await DecisionService.getStatistics(userId);
        console.log('Stats returned:', stats);
        return stats;
      } catch (error) {
        console.error('Error in stats endpoint:', error);
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.get('/decisions/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const decision = await DecisionService.getDecisionById(id, userId);

        if (!decision) {
          return reply.code(404).send({ error: 'Decision not found' });
        }

        return decision;
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.post('/decisions', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as any;
        const decision = await DecisionService.createDecision(userId, body);

        return reply.code(201).send(decision);
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.patch('/decisions/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as any;
        const decision = await DecisionService.updateDecision(id, userId, body);

        if (!decision) {
          return reply.code(404).send({ error: 'Decision not found' });
        }

        return decision;
      } catch (error: any) {
        server.log.error(error);

        // Handle concurrent edit conflict
        if (error.code === 'CONFLICT') {
          return reply.code(409).send({
            error: 'Conflict',
            message: error.message,
            currentData: error.currentData
          });
        }

        // Handle deleted decision (Feature #266)
        if (error.code === 'GONE') {
          return reply.code(410).send({
            error: 'Gone',
            message: error.message || 'This decision has been deleted.',
            canRedirect: true
          });
        }

        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.delete('/decisions/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const decision = await DecisionService.deleteDecision(id, userId);

        if (!decision) {
          return reply.code(404).send({ error: 'Decision not found' });
        }

        return { message: 'Decision deleted', decision };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Bulk delete decisions endpoint
    api.post('/decisions/bulk-delete', async (request, reply) => {
      try {
        const { decisionIds } = request.body as { decisionIds: string[] };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        if (!Array.isArray(decisionIds) || decisionIds.length === 0) {
          return reply.code(400).send({ error: 'decisionIds must be a non-empty array' });
        }

        // Delete all decisions
        const deletedDecisions = [];
        const errors = [];

        for (const decisionId of decisionIds) {
          try {
            const decision = await DecisionService.deleteDecision(decisionId, userId);
            if (decision) {
              deletedDecisions.push(decision);
            } else {
              errors.push({ id: decisionId, error: 'Not found or unauthorized' });
            }
          } catch (error) {
            errors.push({ id: decisionId, error: 'Failed to delete' });
          }
        }

        return {
          message: `Deleted ${deletedDecisions.length} decisions`,
          deletedCount: deletedDecisions.length,
          deletedDecisions,
          errors: errors.length > 0 ? errors : undefined
        };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Bulk restore deleted decisions
    api.post('/decisions/bulk-restore', async (request, reply) => {
      try {
        const { decisionIds } = request.body as { decisionIds: string[] };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        if (!Array.isArray(decisionIds) || decisionIds.length === 0) {
          return reply.code(400).send({ error: 'decisionIds must be a non-empty array' });
        }

        // Restore all decisions
        const restoredDecisions = [];
        const errors = [];

        for (const decisionId of decisionIds) {
          try {
            const decision = await DecisionService.restoreDecision(decisionId, userId);
            if (decision) {
              restoredDecisions.push(decision);
            } else {
              errors.push({ id: decisionId, error: 'Not found or unauthorized' });
            }
          } catch (error) {
            errors.push({ id: decisionId, error: 'Failed to restore' });
          }
        }

        return {
          message: `Restored ${restoredDecisions.length} decisions`,
          restoredCount: restoredDecisions.length,
          restoredDecisions,
          errors: errors.length > 0 ? errors : undefined
        };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Restore a single soft-deleted decision
    api.post('/decisions/:id/restore', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        if (!id) {
          return reply.code(400).send({ error: 'Decision ID is required' });
        }

        const decision = await DecisionService.restoreDecision(id, userId);

        if (!decision) {
          return reply.code(404).send({ error: 'Decision not found or unauthorized' });
        }

        return {
          message: 'Decision restored successfully',
          decision
        };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Bulk permanent delete (hard delete from database)
    api.post('/decisions/bulk-permanent-delete', async (request, reply) => {
      try {
        const { decisionIds } = request.body as { decisionIds: string[] };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        if (!Array.isArray(decisionIds) || decisionIds.length === 0) {
          return reply.code(400).send({ error: 'decisionIds must be a non-empty array' });
        }

        // Permanently delete all decisions
        const deletedDecisions = [];
        const errors = [];

        for (const decisionId of decisionIds) {
          try {
            const decision = await DecisionService.permanentlyDeleteDecision(decisionId, userId);
            if (decision) {
              deletedDecisions.push(decision);
            } else {
              errors.push({ id: decisionId, error: 'Not found, unauthorized, or not in trash' });
            }
          } catch (error) {
            errors.push({ id: decisionId, error: 'Failed to permanently delete' });
          }
        }

        return {
          message: `Permanently deleted ${deletedDecisions.length} decisions`,
          deletedCount: deletedDecisions.length,
          deletedDecisions,
          errors: errors.length > 0 ? errors : undefined
        };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Option management endpoints
    api.post('/decisions/:id/options', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // Verify decision belongs to user
        const { data: decision, error: decisionError } = await supabase
          .from('decisions')
          .select('id')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (decisionError || !decision) {
          return reply.code(404).send({ error: 'Decision not found' });
        }

        const body = request.body as { title: string; description?: string };

        if (!body.title || !body.title.trim()) {
          return reply.code(400).send({ error: 'Option title is required' });
        }

        // Create new option
        const { data: option, error: optionError } = await supabase
          .from('options')
          .insert({
            decision_id: id,
            title: body.title,
            description: body.description || null
          })
          .select()
          .single();

        if (optionError) {
          server.log.error(optionError);
          return reply.code(500).send({ error: 'Failed to create option' });
        }

        return option;
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.patch('/options/:optionId', async (request, reply) => {
      try {
        const { optionId } = request.params as { optionId: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // Verify option belongs to user's decision
        const { data: option } = await supabase
          .from('options')
          .select('decision_id')
          .eq('id', optionId)
          .single();

        if (!option) {
          return reply.code(404).send({ error: 'Option not found' });
        }

        const { data: decision } = await supabase
          .from('decisions')
          .select('id')
          .eq('id', option.decision_id)
          .eq('user_id', userId)
          .single();

        if (!decision) {
          return reply.code(403).send({ error: 'Forbidden' });
        }

        const body = request.body as { title?: string; description?: string };

        // Update option
        const { data: updatedOption, error: updateError } = await supabase
          .from('options')
          .update({
            ...(body.title && { title: body.title }),
            ...(body.description !== undefined && { description: body.description })
          })
          .eq('id', optionId)
          .select()
          .single();

        if (updateError) {
          server.log.error(updateError);
          return reply.code(500).send({ error: 'Failed to update option' });
        }

        return updatedOption;
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.delete('/options/:optionId', async (request, reply) => {
      try {
        const { optionId } = request.params as { optionId: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // Verify option belongs to user's decision
        const { data: option } = await supabase
          .from('options')
          .select('decision_id')
          .eq('id', optionId)
          .single();

        if (!option) {
          return reply.code(404).send({ error: 'Option not found' });
        }

        const { data: decision } = await supabase
          .from('decisions')
          .select('id')
          .eq('id', option.decision_id)
          .eq('user_id', userId)
          .single();

        if (!decision) {
          return reply.code(403).send({ error: 'Forbidden' });
        }

        // Delete option
        const { error: deleteError } = await supabase
          .from('options')
          .delete()
          .eq('id', optionId);

        if (deleteError) {
          server.log.error(deleteError);
          return reply.code(500).send({ error: 'Failed to delete option' });
        }

        return { message: 'Option deleted successfully' };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Pros/Cons management endpoints
    api.post('/options/:optionId/pros-cons', async (request, reply) => {
      try {
        const { optionId } = request.params as { optionId: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // Verify option belongs to user's decision
        const { data: option } = await supabase
          .from('options')
          .select('decision_id')
          .eq('id', optionId)
          .single();

        if (!option) {
          return reply.code(404).send({ error: 'Option not found' });
        }

        const { data: decision } = await supabase
          .from('decisions')
          .select('id')
          .eq('id', option.decision_id)
          .eq('user_id', userId)
          .single();

        if (!decision) {
          return reply.code(403).send({ error: 'Forbidden' });
        }

        const body = request.body as { type: 'pro' | 'con'; content: string; weight?: number };

        if (!body.content || !body.content.trim()) {
          return reply.code(400).send({ error: 'Content is required' });
        }

        if (!body.type || !['pro', 'con'].includes(body.type)) {
          return reply.code(400).send({ error: 'Type must be "pro" or "con"' });
        }

        // Create new pro/con
        const { data: proCon, error: proConError } = await supabase
          .from('pros_cons')
          .insert({
            option_id: optionId,
            type: body.type,
            content: body.content,
            weight: body.weight || 5,
            ai_extracted: false,
            display_order: 0
          })
          .select()
          .single();

        if (proConError) {
          server.log.error(proConError);
          return reply.code(500).send({ error: 'Failed to create pro/con' });
        }

        return reply.code(201).send(proCon);
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.patch('/pros-cons/:proConId', async (request, reply) => {
      try {
        const { proConId } = request.params as { proConId: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // Verify pro/con belongs to user's decision
        const { data: proCon } = await supabase
          .from('pros_cons')
          .select('option_id')
          .eq('id', proConId)
          .single();

        if (!proCon) {
          return reply.code(404).send({ error: 'Pro/Con not found' });
        }

        const { data: option } = await supabase
          .from('options')
          .select('decision_id')
          .eq('id', proCon.option_id)
          .single();

        if (!option) {
          return reply.code(404).send({ error: 'Option not found' });
        }

        const { data: decision } = await supabase
          .from('decisions')
          .select('id')
          .eq('id', option.decision_id)
          .eq('user_id', userId)
          .single();

        if (!decision) {
          return reply.code(403).send({ error: 'Forbidden' });
        }

        const body = request.body as { content?: string; weight?: number; type?: 'pro' | 'con'; option_id?: string };

        // If option_id is being changed, verify the new option belongs to the same decision
        if (body.option_id && body.option_id !== proCon.option_id) {
          const { data: newOption } = await supabase
            .from('options')
            .select('decision_id')
            .eq('id', body.option_id)
            .single();

          if (!newOption || newOption.decision_id !== option.decision_id) {
            return reply.code(400).send({ error: 'Cannot move pro/con to an option in a different decision' });
          }
        }

        // Update pro/con
        const { data: updated, error: updateError } = await supabase
          .from('pros_cons')
          .update({
            ...(body.content !== undefined && { content: body.content }),
            ...(body.weight !== undefined && { weight: body.weight }),
            ...(body.type !== undefined && { type: body.type }),
            ...(body.option_id !== undefined && { option_id: body.option_id })
          })
          .eq('id', proConId)
          .select()
          .single();

        if (updateError) {
          server.log.error(updateError);
          return reply.code(500).send({ error: 'Failed to update pro/con' });
        }

        return updated;
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.delete('/pros-cons/:proConId', async (request, reply) => {
      try {
        const { proConId } = request.params as { proConId: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // Verify pro/con belongs to user's decision
        const { data: proCon } = await supabase
          .from('pros_cons')
          .select('option_id')
          .eq('id', proConId)
          .single();

        if (!proCon) {
          return reply.code(404).send({ error: 'Pro/Con not found' });
        }

        const { data: option } = await supabase
          .from('options')
          .select('decision_id')
          .eq('id', proCon.option_id)
          .single();

        if (!option) {
          return reply.code(404).send({ error: 'Option not found' });
        }

        const { data: decision } = await supabase
          .from('decisions')
          .select('id')
          .eq('id', option.decision_id)
          .eq('user_id', userId)
          .single();

        if (!decision) {
          return reply.code(403).send({ error: 'Forbidden' });
        }

        // Delete pro/con
        const { error: deleteError } = await supabase
          .from('pros_cons')
          .delete()
          .eq('id', proConId);

        if (deleteError) {
          server.log.error(deleteError);
          return reply.code(500).send({ error: 'Failed to delete pro/con' });
        }

        return { message: 'Pro/Con deleted successfully' };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Recording endpoints
    api.post('/recordings/upload', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // Get uploaded file
        const data = await request.file();
        if (!data) {
          return reply.code(400).send({ error: 'No audio file provided' });
        }

        // Read file buffer
        const buffer = await data.toBuffer();

        // Create a processing job
        const job = jobManager.createJob(userId, '', null);

        // Start async processing in the background
        AsyncVoiceService.startBackgroundProcessing(
          job.id,
          userId,
          buffer,
          data.filename
        );

        // Return job ID immediately for polling
        return reply.code(202).send({
          jobId: job.id,
          status: job.status,
          message: 'Processing started. Poll /recordings/:id/status for updates.',
        });
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({
          error: 'Failed to start processing',
          message: (error as Error).message,
        });
      }
    });

    api.post('/recordings/:id/process', async (request) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      // TODO: Implement processing trigger (verify ownership)
      return { message: 'Process endpoint - to be implemented', id, userId };
    });

    api.get('/recordings/:id/status', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      // Get job from manager
      const job = jobManager.getJob(id);

      if (!job) {
        return reply.code(404).send({ error: 'Job not found' });
      }

      // Verify ownership
      if (job.userId !== userId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      // Return job status
      return {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        decisionId: job.decisionId,
        errorMessage: job.errorMessage,
        errorCode: job.errorCode,
      };
    });

    // Categories
    api.get('/categories', async (request) => {
      const userId = request.user?.id;

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      try {
        // Fetch categories for this user (both system categories and user-created)
        const { data: categories, error } = await supabase
          .from('categories')
          .select('*')
          .or(`user_id.eq.${userId},user_id.is.null`)
          .order('name', { ascending: true });

        if (error) {
          server.log.error(error);
          return { error: 'Failed to fetch categories' };
        }

        return { categories: categories || [] };
      } catch (error) {
        server.log.error(error);
        return { error: 'Internal server error' };
      }
    });

    api.post('/categories', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as {
          name: string;
          icon?: string;
          color?: string;
        };

        if (!body.name || body.name.trim() === '') {
          return reply.code(400).send({ error: 'Category name is required' });
        }

        // Generate slug from name
        const slug = body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Create category
        const { data: category, error } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: body.name.trim(),
            slug,
            icon: body.icon || '📁',
            color: body.color || '#00d4aa',
          })
          .select()
          .single();

        if (error) {
          server.log.error(error);
          return reply.code(500).send({ error: 'Failed to create category' });
        }

        return category;
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.patch('/categories/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as {
          name?: string;
          icon?: string;
          color?: string;
        };

        // Build update object with only provided fields
        const updates: any = {};

        if (body.name !== undefined) {
          if (body.name.trim() === '') {
            return reply.code(400).send({ error: 'Category name cannot be empty' });
          }
          updates.name = body.name.trim();
          // Update slug when name changes
          updates.slug = body.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }

        if (body.icon !== undefined) {
          updates.icon = body.icon;
        }

        if (body.color !== undefined) {
          updates.color = body.color;
        }

        if (Object.keys(updates).length === 0) {
          return reply.code(400).send({ error: 'No valid fields to update' });
        }

        // Update category (RLS will ensure user can only update their own categories)
        const { data: category, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId) // Ensure ownership
          .select()
          .single();

        if (error) {
          server.log.error(error);
          if (error.code === 'PGRST116') {
            return reply.code(404).send({ error: 'Category not found or you do not have permission to edit it' });
          }
          return reply.code(500).send({ error: 'Failed to update category' });
        }

        return category;
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.delete('/categories/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // First, check if category has any decisions
        const { data: decisions, error: decisionError } = await supabase
          .from('decisions')
          .select('id')
          .eq('category_id', id)
          .limit(1);

        if (decisionError) {
          server.log.error(decisionError);
          return reply.code(500).send({ error: 'Failed to check category usage' });
        }

        if (decisions && decisions.length > 0) {
          return reply.code(400).send({
            error: 'Cannot delete category with existing decisions',
            message: 'Please reassign or delete all decisions in this category first'
          });
        }

        // Delete category (RLS will ensure user can only delete their own categories)
        const { data: category, error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', userId) // Ensure ownership
          .select()
          .single();

        if (error) {
          server.log.error(error);
          if (error.code === 'PGRST116') {
            return reply.code(404).send({ error: 'Category not found or you do not have permission to delete it' });
          }
          return reply.code(500).send({ error: 'Failed to delete category' });
        }

        return { success: true, deleted: category };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Insights
    api.get('/insights', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const insights = await InsightsService.getInsights(userId);
        return insights;
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch insights' });
      }
    });

    // Profile
    api.get('/profile', async (request) => {
      const userId = request.user?.id;
      // TODO: Implement profile fetch
      return { message: 'Profile endpoint - to be implemented', userId };
    });

    api.patch('/profile', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as { name?: string };

        if (!body.name || body.name.trim() === '') {
          return reply.code(400).send({ error: 'Name is required' });
        }

        // Update user metadata using Supabase Admin API
        const { data, error } = await supabase.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              name: body.name.trim()
            }
          }
        );

        if (error) {
          server.log.error({ error }, 'Failed to update user profile');
          return reply.code(500).send({ error: 'Failed to update profile' });
        }

        return {
          success: true,
          profile: {
            name: data.user.user_metadata.name,
            email: data.user.email
          }
        };
      } catch (error) {
        server.log.error({ error }, 'Error updating profile');
        return reply.code(500).send({ error: 'Failed to update profile' });
      }
    });

    // Get user settings
    api.get('/profile/settings', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // Fetch user with metadata
        const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

        if (error || !user) {
          server.log.error({ error }, 'Failed to fetch user settings');
          return reply.code(500).send({ error: 'Failed to fetch settings' });
        }

        const metadata = user.user_metadata || {};

        return {
          success: true,
          settings: {
            outcome_reminders_enabled: metadata.outcome_reminders_enabled ?? true,
            weekly_digest_enabled: metadata.weekly_digest_enabled ?? false,
            quiet_hours_enabled: metadata.quiet_hours_enabled ?? true,
            quiet_hours_start: metadata.quiet_hours_start || '22:00',
            quiet_hours_end: metadata.quiet_hours_end || '08:00',
            timezone: metadata.timezone || 'UTC'
          }
        };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.patch('/profile/settings', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as {
          outcome_reminders_enabled?: boolean;
          weekly_digest_enabled?: boolean;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string; // "HH:MM" format
          quiet_hours_end?: string; // "HH:MM" format
          timezone?: string;
        };

        // Validate time format if provided
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (body.quiet_hours_start && !timeRegex.test(body.quiet_hours_start)) {
          return reply.code(400).send({ error: 'Invalid quiet_hours_start format. Use HH:MM' });
        }
        if (body.quiet_hours_end && !timeRegex.test(body.quiet_hours_end)) {
          return reply.code(400).send({ error: 'Invalid quiet_hours_end format. Use HH:MM' });
        }

        // Build metadata update object with only provided fields
        const metadataUpdate: Record<string, any> = {};
        if (body.outcome_reminders_enabled !== undefined) {
          metadataUpdate.outcome_reminders_enabled = body.outcome_reminders_enabled;
        }
        if (body.weekly_digest_enabled !== undefined) {
          metadataUpdate.weekly_digest_enabled = body.weekly_digest_enabled;
        }
        if (body.quiet_hours_enabled !== undefined) {
          metadataUpdate.quiet_hours_enabled = body.quiet_hours_enabled;
        }
        if (body.quiet_hours_start !== undefined) {
          metadataUpdate.quiet_hours_start = body.quiet_hours_start;
        }
        if (body.quiet_hours_end !== undefined) {
          metadataUpdate.quiet_hours_end = body.quiet_hours_end;
        }
        if (body.timezone !== undefined) {
          metadataUpdate.timezone = body.timezone;
        }

        // Update user metadata with notification preferences
        const { error } = await supabase.auth.admin.updateUserById(
          userId,
          {
            user_metadata: metadataUpdate
          }
        );

        if (error) {
          server.log.error({ error }, 'Failed to update settings');
          return reply.code(500).send({ error: 'Failed to update settings' });
        }

        return {
          success: true,
          settings: metadataUpdate
        };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Feature #19: Account deletion requires password confirmation
    api.delete('/profile', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as { password: string; confirm: string };

        // Validate password is provided
        if (!body.password || typeof body.password !== 'string') {
          return reply.code(400).send({ error: 'Password is required' });
        }

        // Validate "DELETE" confirmation
        if (!body.confirm || body.confirm !== 'DELETE') {
          return reply.code(400).send({ error: 'Please type DELETE to confirm' });
        }

        // Get user to verify password
        const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(userId);

        if (getUserError || !user || !user.email) {
          server.log.error({ error: getUserError }, 'Failed to fetch user for deletion');
          return reply.code(500).send({ error: 'Failed to verify password' });
        }

        // Verify password by attempting to sign in with the auth client
        const { error: passwordError } = await supabaseAuth.auth.signInWithPassword({
          email: user.email,
          password: body.password
        });

        if (passwordError) {
          server.log.warn({ userId, error: passwordError }, 'Password verification failed for account deletion');
          return reply.code(401).send({ error: 'Incorrect password' });
        }

        // Password verified - schedule account for deletion (30-day grace period)
        // We set deleted_at timestamp but don't actually delete yet
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              ...user.user_metadata,
              deleted_at: new Date().toISOString(),
              deletion_requested_at: new Date().toISOString()
            }
          }
        );

        if (updateError) {
          server.log.error({ error: updateError }, 'Failed to mark account for deletion');
          return reply.code(500).send({ error: 'Failed to process deletion request' });
        }

        // Log out all sessions for this user
        await supabase.auth.admin.signOut(userId);

        return {
          success: true,
          message: 'Account marked for deletion. You have 30 days to cancel this request by contacting support.'
        };
      } catch (error) {
        server.log.error({ error }, 'Error processing account deletion');
        return reply.code(500).send({ error: 'Failed to process account deletion' });
      }
    });

    // Export
    api.post('/export/json', async (request, reply) => {
      const userId = request.user?.id;
      if (!userId) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      try {
        // Feature #275: JSON export contains all records with complete related data
        // Fetch all user's decisions with options, pros/cons, and category
        // Note: Using !options_decision_id_fkey to specify the relationship (decision -> options)
        const { data: decisions, error } = await supabase
          .from('decisions')
          .select(`
            *,
            category:category_id(
              id,
              name,
              slug,
              icon,
              color
            ),
            options!options_decision_id_fkey(
              id,
              title,
              description,
              display_order,
              is_chosen,
              ai_extracted,
              pros_cons(
                id,
                type,
                content,
                weight,
                display_order,
                ai_extracted
              )
            )
          `)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Create export data
        const exportData = {
          exportDate: new Date().toISOString(),
          totalDecisions: decisions?.length || 0,
          decisions: decisions || [],
        };

        // Return JSON data directly (client handles download)
        return exportData;
      } catch (error) {
        console.error('Export JSON error:', error);
        reply.code(500);
        return { error: 'Failed to export data' };
      }
    });

    api.post('/export/csv', async (request) => {
      const userId = request.user?.id;
      // TODO: Implement CSV export
      return { message: 'Export CSV - to be implemented', userId };
    });

    api.post('/export/pdf', async (request) => {
      const userId = request.user?.id;
      // TODO: Implement PDF export (async)
      return { message: 'Export PDF - to be implemented', userId };
    });

    // Feature #281: Audio recordings export
    api.post('/export/audio', async (request, reply) => {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      try {
        // Fetch all decisions with audio URLs for this user
        const { data: decisions, error } = await supabase
          .from('decisions')
          .select('id, title, audio_url, audio_duration_seconds, created_at')
          .eq('user_id', userId)
          .not('audio_url', 'is', null)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching audio decisions:', error);
          return reply.status(500).send({ error: 'Failed to fetch audio recordings' });
        }

        if (!decisions || decisions.length === 0) {
          return reply.status(404).send({ error: 'No audio recordings found' });
        }

        // Return list of audio recordings with metadata
        // In a real implementation, you would fetch the actual files from Supabase Storage
        // and create a ZIP file. For now, we return the metadata which can be used
        // to download the files directly.
        const audioRecordings = decisions.map(decision => ({
          decisionId: decision.id,
          title: decision.title,
          audioUrl: decision.audio_url,
          duration: decision.audio_duration_seconds,
          recordedAt: decision.created_at,
          fileName: `${decision.title.replace(/[^a-z0-9]/gi, '_')}_${decision.id.slice(0, 8)}.mp3`,
        }));

        return {
          success: true,
          count: audioRecordings.length,
          recordings: audioRecordings,
          message: `Found ${audioRecordings.length} audio recording(s)`,
        };
      } catch (error) {
        console.error('Audio export error:', error);
        return reply.status(500).send({ error: 'Failed to export audio recordings' });
      }
    });

    // Outcomes
    api.get('/decisions/:id/outcomes', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;

      if (!userId) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      // Verify the decision belongs to the user (Feature #15)
      // Don't select outcome_satisfaction as the column may not exist
      const { data: decision, error: decisionError } = await supabase
        .from('decisions')
        .select('id, user_id, outcome, outcome_notes, outcome_recorded_at')
        .eq('id', id)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .maybeSingle();

      if (decisionError || !decision) {
        // Decision not found or doesn't belong to user - return 404 to avoid leaking information
        reply.code(404);
        return { error: 'Not Found', message: 'Decision not found' };
      }

      // Return outcome data if it exists
      if (decision.outcome) {
        return {
          outcomes: [{
            id: decision.id,
            result: decision.outcome,
            notes: decision.outcome_notes,
            satisfaction: null, // outcome_satisfaction column doesn't exist in DB
            recordedAt: decision.outcome_recorded_at
          }],
          decisionId: id
        };
      }

      // No outcome recorded yet
      return { outcomes: [], decisionId: id };
    });

    api.post('/decisions/:id/outcomes', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;

      if (!userId) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      try {
        const body = request.body as { result?: string; satisfaction?: number; notes?: string } | null;

        console.log('Outcome recording - body:', JSON.stringify(body));
        console.log('Outcome recording - id:', id);
        console.log('Outcome recording - userId:', userId);

        if (!body) {
          reply.code(400);
          return { error: 'Request body is required' };
        }

        // Validate satisfaction rating (must be 1-5 if provided)
        if (body.satisfaction !== undefined) {
          if (typeof body.satisfaction !== 'number' || !Number.isInteger(body.satisfaction)) {
            reply.code(400);
            return { error: 'Satisfaction must be an integer' };
          }
          if (body.satisfaction < 1 || body.satisfaction > 5) {
            reply.code(400);
            return { error: 'Satisfaction must be between 1 and 5' };
          }
        }

        // Map result to outcome value (better, worse, as_expected)
        let outcome: string | undefined;
        if (body.result === 'positive' || body.result === 'better') {
          outcome = 'better';
        } else if (body.result === 'negative' || body.result === 'worse') {
          outcome = 'worse';
        } else if (body.result === 'neutral' || body.result === 'as_expected') {
          outcome = 'as_expected';
        } else if (body.result) {
          outcome = body.result; // Pass through if already valid
        }

        console.log('Outcome recording - mapped outcome:', outcome);

        // Update the decision with outcome data
        // Note: Keep existing status, just update outcome fields
        const { data: updated, error } = await supabase
          .from('decisions')
          .update({
            outcome: outcome,
            outcome_notes: body.notes || null,
            outcome_satisfaction: body.satisfaction ?? null,
            outcome_recorded_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .select()
          .single();

        console.log('Outcome recording - supabase result:', { updated, error });

        if (error) {
          // If column doesn't exist yet, try without it
          if (error.message.includes('outcome_satisfaction')) {
            console.log('outcome_satisfaction column does not exist, skipping...');
            const { data: updated2, error: error2 } = await supabase
              .from('decisions')
              .update({
                outcome: outcome,
                outcome_notes: body.notes || null,
                outcome_recorded_at: new Date().toISOString()
              })
              .eq('id', id)
              .eq('user_id', userId)
              .is('deleted_at', null)
              .select()
              .single();

            // Check if decision was deleted (PGRST116 = 0 rows returned)
            if (error2 && error2.code === 'PGRST116') {
              // Decision not found or deleted (Feature #266)
              reply.code(410);
              return {
                error: 'Gone',
                message: 'This decision has been deleted.',
                canRedirect: true
              };
            }

            if (error2) {
              console.error('Supabase error:', error2);
              throw error2;
            }

            if (!updated2) {
              // Decision not found or deleted (Feature #266)
              reply.code(410);
              return {
                error: 'Gone',
                message: 'This decision has been deleted.',
                canRedirect: true
              };
            }

            return {
              success: true,
              outcome: {
                id: id,
                result: updated2.outcome,
                satisfaction: body.satisfaction,
                notes: updated2.outcome_notes,
                recordedAt: updated2.outcome_recorded_at
              }
            };
          }
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Outcome recording - supabase result:', { updated, error });

        if (!updated) {
          // Decision not found or deleted (Feature #266)
          reply.code(410);
          return {
            error: 'Gone',
            message: 'This decision has been deleted.',
            canRedirect: true
          };
        }

        return {
          success: true,
          outcome: {
            id: id,
            result: updated.outcome,
            satisfaction: updated.outcome_satisfaction,
            notes: updated.outcome_notes,
            recordedAt: updated.outcome_recorded_at
          }
        };
      } catch (error) {
        console.error('Error recording outcome:', error);
        reply.code(500);
        return { error: 'Failed to record outcome' };
      }
    });

    // Reminders
    api.get('/decisions/:id/reminders', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // Query reminders for this decision
        const { data: reminders, error } = await supabase
          .from('DecisionsFollowUpReminders')
          .select('*')
          .eq('decision_id', id)
          .eq('user_id', userId)
          .order('remind_at', { ascending: true });

        if (error) {
          server.log.error(error);
          return reply.code(500).send({ error: 'Failed to fetch reminders' });
        }

        return { reminders: reminders || [], decisionId: id };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    api.post('/decisions/:id/reminders', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as {
          remind_at: string; // ISO timestamp with timezone info
          timezone?: string; // User's timezone (e.g., 'Europe/Rome')
        };

        if (!body.remind_at) {
          return reply.code(400).send({ error: 'remind_at is required' });
        }

        // Parse the remind_at timestamp
        const remindAt = new Date(body.remind_at);
        if (isNaN(remindAt.getTime())) {
          return reply.code(400).send({ error: 'Invalid remind_at date format' });
        }

        // Verify the decision exists and belongs to user
        const { data: decision, error: decisionError } = await supabase
          .from('decisions')
          .select('id, user_id, deleted_at')
          .eq('id', id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        if (decisionError || !decision) {
          // Decision not found or deleted
          return reply.code(410).send({
            error: 'Gone',
            message: 'This decision has been deleted.',
            canRedirect: true
          });
        }

        // Create the reminder
        // Note: remind_at is stored as UTC ISO timestamp
        // The frontend sends local time converted to UTC
        const { data: reminder, error } = await supabase
          .from('DecisionsFollowUpReminders')
          .insert({
            decision_id: id,
            user_id: userId,
            remind_at: remindAt.toISOString(),
            status: 'pending'
          })
          .select()
          .single();

        if (error) {
          server.log.error(error);
          return reply.code(500).send({ error: 'Failed to create reminder' });
        }

        return {
          success: true,
          reminder,
          message: `Reminder set for ${remindAt.toISOString()}`
        };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Delete a reminder
    api.delete('/decisions/:id/reminders/:reminderId', async (request, reply) => {
      try {
        const { id, reminderId } = request.params as { id: string; reminderId: string };
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { error } = await supabase
          .from('DecisionsFollowUpReminders')
          .delete()
          .eq('id', reminderId)
          .eq('decision_id', id)
          .eq('user_id', userId);

        if (error) {
          server.log.error(error);
          return reply.code(500).send({ error: 'Failed to delete reminder' });
        }

        return { success: true, message: 'Reminder deleted' };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Mark a reminder as completed
    api.patch('/decisions/:id/reminders/:reminderId', async (request, reply) => {
      try {
        const { id, reminderId } = request.params as { id: string; reminderId: string };
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as { status?: string };

        const { data: reminder, error } = await supabase
          .from('DecisionsFollowUpReminders')
          .update({ status: body.status || 'completed' })
          .eq('id', reminderId)
          .eq('decision_id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          server.log.error(error);
          return reply.code(500).send({ error: 'Failed to update reminder' });
        }

        return { success: true, reminder };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Pending Reviews - fetch outcome reminders that are due
    api.get('/pending-reviews', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // Fetch user settings to get quiet hours preference
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        const userMetadata = user?.user_metadata || {};

        // Get quiet hours settings (default: 10pm-8am if not set)
        const quietHoursStart = userMetadata.quiet_hours_start || '22:00';
        const quietHoursEnd = userMetadata.quiet_hours_end || '08:00';
        const quietHoursEnabled = userMetadata.quiet_hours_enabled !== false; // default true

        // Get current time in user's timezone (or UTC if not specified)
        const now = new Date();
        const userTimezone = userMetadata.timezone || 'UTC';

        // Create formatter for user's timezone
        const timeZoneFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        // Get current time in user's timezone as "HH:MM"
        const currentTimeStr = timeZoneFormatter.format(now);

        // Check if current time is within quiet hours
        const isCurrentlyQuietHours = quietHoursEnabled && isInQuietHours(currentTimeStr, quietHoursStart, quietHoursEnd);

        // Query decisions table for pending outcome reviews
        // A decision needs a review if it has a follow_up_date that has passed
        // but hasn't been notified yet (or outcome not recorded)
        const { data: decisions, error } = await supabase
          .from('decisions')
          .select(`
            id,
            title,
            status,
            decided_at,
            follow_up_date,
            follow_up_notified
          `)
          .eq('user_id', userId)
          .not('follow_up_date', 'is', null)
          .lte('follow_up_date', new Date().toISOString())
          .order('follow_up_date', { ascending: true });

        if (error) {
          server.log.error(error);
          return reply.code(500).send({ error: 'Failed to fetch pending reviews' });
        }

        // Filter decisions based on quiet hours
        let filteredDecisions = decisions || [];

        if (isCurrentlyQuietHours && quietHoursEnabled) {
          // During quiet hours, only show decisions whose follow_up_date was BEFORE quiet hours started today

          // Calculate when quiet hours started today
          const todayQuietStart = getTodayTimeAt(quietHoursStart, userTimezone);
          const todayQuietEnd = getTodayTimeAt(quietHoursEnd, userTimezone);

          server.log.info({
            currentTime: now.toISOString(),
            currentTimeStr,
            quietHoursStart,
            quietHoursEnd,
            userTimezone,
            todayQuietStart: todayQuietStart.toISOString(),
            todayQuietEnd: todayQuietEnd.toISOString(),
            isCurrentlyQuietHours
          }, 'Quiet hours filter');

          // If quiet hours end time is before start time (e.g., 22:00 to 08:00),
          // it means quiet hours span midnight
          const quietStartTimestamp = parseTimeString(quietHoursStart);
          const quietEndTimestamp = parseTimeString(quietHoursEnd);
          const spansMidnight = quietEndTimestamp < quietStartTimestamp;

          filteredDecisions = filteredDecisions.filter(decision => {
            const followUpAt = new Date(decision.follow_up_date);
            const shouldShow = spansMidnight
              ? (followUpAt < todayQuietStart || now >= todayQuietEnd)
              : (followUpAt < todayQuietStart || now >= todayQuietEnd);

            server.log.info({
              decisionTitle: decision.title,
              followUpAt: followUpAt.toISOString(),
              shouldShow,
              spansMidnight
            }, 'Filter decision');

            return shouldShow;
          });
        }

        // Transform decisions into pending reviews format
        const pendingReviews = filteredDecisions.map(decision => ({
          id: decision.id,
          decision_id: decision.id,
          remind_at: decision.follow_up_date,
          status: 'pending',
          decisions: {
            id: decision.id,
            title: decision.title,
            status: decision.status,
            decided_at: decision.decided_at
          }
        }));

        return { pendingReviews };
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

  }, { prefix: '/api/v1' });
}

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    const port = parseInt(process.env.API_PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Decisions API Server                                    ║
║   ────────────────────────────────────────────────────    ║
║                                                           ║
║   🚀 Server running at http://localhost:${port}            ║
║   📋 Health check: http://localhost:${port}/health         ║
║   🔌 API: http://localhost:${port}/api/v1                  ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
