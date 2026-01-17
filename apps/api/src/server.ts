import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from './middleware/auth';
import { DecisionService } from './services/decisionServiceNew';
import { VoiceService } from './services/voiceService';

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from monorepo root
config({ path: path.resolve(__dirname, '../../../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          category: query.category,
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
      } catch (error) {
        server.log.error(error);
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

        const body = request.body as { content?: string; weight?: number };

        // Update pro/con
        const { data: updated, error: updateError } = await supabase
          .from('pros_cons')
          .update({
            ...(body.content !== undefined && { content: body.content }),
            ...(body.weight !== undefined && { weight: body.weight })
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

        // Process the voice recording through the pipeline
        const result = await VoiceService.processVoiceRecording(
          userId,
          buffer,
          data.filename
        );

        // Create decision from extracted data
        const decision = await DecisionService.createDecision(userId, {
          title: result.extraction.title,
          status: 'draft',
          category: result.extraction.suggestedCategory || 'Personal',
          emotional_state: result.extraction.emotionalState,
          options: result.extraction.options,
          transcription: result.transcript,
          audio_url: result.audioUrl,
          audio_duration_seconds: result.duration,
        });

        return reply.code(201).send({
          decision,
          transcript: result.transcript,
          extraction: result.extraction,
        });
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({
          error: 'Voice processing failed',
          message: (error as Error).message,
        });
      }
    });

    api.post('/recordings/:id/process', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      // TODO: Implement processing trigger (verify ownership)
      return { message: 'Process endpoint - to be implemented', id, userId };
    });

    api.get('/recordings/:id/status', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      // TODO: Implement status polling (verify ownership)
      return { status: 'pending', progress: 0, id, userId };
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
    api.get('/insights', async (request) => {
      const userId = request.user?.id;
      // TODO: Implement insights for this user
      return {
        score: 50,
        patterns: {
          timing: null,
          emotional: null,
          categories: null,
        },
        summary: null,
        userId,
      };
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

    api.patch('/profile/settings', async (request) => {
      const userId = request.user?.id;
      // TODO: Implement settings update
      return { message: 'Settings update - to be implemented', userId };
    });

    api.delete('/profile', async (request) => {
      const userId = request.user?.id;
      // TODO: Implement account deletion
      return { message: 'Account deletion - to be implemented', userId };
    });

    // Export
    api.post('/export/json', async (request) => {
      const userId = request.user?.id;
      // TODO: Implement JSON export
      return { message: 'Export JSON - to be implemented', userId };
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

    // Outcomes
    api.get('/decisions/:id/outcomes', async (request) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      // TODO: Implement outcomes list
      return { outcomes: [], decisionId: id, userId };
    });

    api.post('/decisions/:id/outcomes', async (request) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      // TODO: Implement outcome creation
      return { message: 'Create outcome - to be implemented', decisionId: id, userId };
    });

    // Reminders
    api.get('/decisions/:id/reminders', async (request) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      // TODO: Implement reminders list
      return { reminders: [], decisionId: id, userId };
    });

    api.post('/decisions/:id/reminders', async (request) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      // TODO: Implement reminder creation
      return { message: 'Create reminder - to be implemented', decisionId: id, userId };
    });

    // Pending Reviews - fetch outcome reminders that are due
    api.get('/pending-reviews', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        // Query outcome_reminders table for pending reviews
        const { data: reminders, error } = await supabase
          .from('outcome_reminders')
          .select(`
            id,
            decision_id,
            remind_at,
            status,
            created_at,
            decisions!inner(
              id,
              title,
              status,
              category,
              decided_at
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'pending')
          .lte('remind_at', new Date().toISOString())
          .order('remind_at', { ascending: true });

        if (error) {
          server.log.error(error);
          return reply.code(500).send({ error: 'Failed to fetch pending reviews' });
        }

        return { pendingReviews: reminders || [] };
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
