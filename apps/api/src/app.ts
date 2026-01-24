// Fastify app configuration - shared between local server and Vercel serverless
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from './middleware/auth.js';
import { DecisionService } from './services/decisionServiceNew.js';
import { AsyncVoiceService } from './services/asyncVoiceService.js';
import { VoiceService } from './services/voiceService.js';
import { jobManager } from './services/jobManager.js';
import { InsightsService } from './services/insightsService.js';
import { loginWithRateLimit } from './services/loginRateLimitService.js';
import { reminderJob } from './services/reminderBackgroundJob.js';

// Initialize Supabase clients
function getSupabaseClients() {
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

  return { supabase, supabaseAuth };
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
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

function getTodayTimeAt(timeStr: string, timezone: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const result = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export async function buildApp(options: { logger?: boolean | object } = {}): Promise<FastifyInstance> {
  const server = Fastify({
    logger: options.logger ?? {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  const { supabase, supabaseAuth } = getSupabaseClients();

  // Register plugins
  await server.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : true,
    credentials: true,
  });

  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  // Health check (public)
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Reminder job stats (public, for monitoring)
  server.get('/reminder-job/stats', async (_request, reply) => {
    try {
      const stats = reminderJob.getStats();
      return { stats };
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Login endpoint with rate limiting (public)
  server.post('/api/v1/login', async (request, reply) => {
    try {
      const { email, password } = request.body as { email: string; password: string };

      if (!email || !password) {
        return reply.code(400).send({ error: 'Email and password are required' });
      }

      const ipAddress = request.headers['x-forwarded-for'] as string ||
                        request.headers['x-real-ip'] as string ||
                        request.ip;

      const result = await loginWithRateLimit(email, password, ipAddress);

      if (!result.success) {
        return reply.code(400).send({
          error: result.error,
          lockoutUntil: result.lockoutUntil?.toISOString()
        });
      }

      return reply.code(200).send({
        success: true,
        session: result.session,
        user: result.session?.user
      });

    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // API version prefix (protected routes)
  server.register(async (api) => {
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
          emotion: query.emotion,
          search: query.search,
          outcome: query.outcome,
          limit: query.limit ? parseInt(query.limit) : 20,
          offset: query.offset ? parseInt(query.offset) : 0,
          cursor: query.cursor,
          fromDate: query.fromDate,
          toDate: query.toDate,
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
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const stats = await DecisionService.getStatistics(userId);
        return stats;
      } catch (error) {
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

        if (error.code === 'CONFLICT') {
          return reply.code(409).send({
            error: 'Conflict',
            message: error.message,
            currentData: error.currentData
          });
        }

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

    // Abandon a decision
    api.post('/decisions/:id/abandon', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as {
          abandonReason: string;
          abandonNote?: string;
        };

        if (!body.abandonReason) {
          return reply.code(400).send({ error: 'abandonReason is required' });
        }

        const decision = await DecisionService.abandonDecision(
          id,
          userId,
          body.abandonReason,
          body.abandonNote
        );

        if (!decision) {
          return reply.code(404).send({ error: 'Decision not found or unauthorized' });
        }

        return {
          message: 'Decision abandoned successfully',
          decision
        };
      } catch (error: any) {
        server.log.error(error);

        if (error.code === 'NOT_FOUND') {
          return reply.code(404).send({ error: error.message });
        }

        if (error.code === 'CONFLICT') {
          return reply.code(409).send({ error: error.message });
        }

        return reply.code(500).send({ error: 'Internal server error' });
      }
    });

    // Bulk permanent delete
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

        const data = await request.file();
        if (!data) {
          return reply.code(400).send({ error: 'No audio file provided' });
        }

        const buffer = await data.toBuffer();

        const { url: audioUrl } = await VoiceService.uploadAudio(
          userId,
          buffer,
          data.filename
        );

        const job = jobManager.createJob(userId, '', null);
        jobManager.updateJob(job.id, { audioUrl });

        AsyncVoiceService.startBackgroundProcessing(
          job.id,
          userId,
          buffer,
          data.filename
        );

        return reply.code(202).send({
          jobId: job.id,
          status: job.status,
          audioUrl: audioUrl,
          message: 'Audio uploaded. Processing started. Poll /recordings/:id/status for updates.',
        });
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({
          error: 'Failed to start processing',
          message: (error as Error).message,
        });
      }
    });

    api.get('/recordings/:id/status', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const job = jobManager.getJob(id);

      if (!job) {
        return reply.code(404).send({ error: 'Job not found' });
      }

      if (job.userId !== userId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

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

        if (body.name.trim().length > 50) {
          return reply.code(400).send({ error: 'Category name must be 50 characters or less' });
        }

        const slug = body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const { data: category, error } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: body.name.trim(),
            slug,
            icon: body.icon || '',
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

        const updates: any = {};

        if (body.name !== undefined) {
          if (body.name.trim() === '') {
            return reply.code(400).send({ error: 'Category name cannot be empty' });
          }
          if (body.name.trim().length > 50) {
            return reply.code(400).send({ error: 'Category name must be 50 characters or less' });
          }
          updates.name = body.name.trim();
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

        const { data: category, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
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

        const { data: category, error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
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
          quiet_hours_start?: string;
          quiet_hours_end?: string;
          timezone?: string;
        };

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (body.quiet_hours_start && !timeRegex.test(body.quiet_hours_start)) {
          return reply.code(400).send({ error: 'Invalid quiet_hours_start format. Use HH:MM' });
        }
        if (body.quiet_hours_end && !timeRegex.test(body.quiet_hours_end)) {
          return reply.code(400).send({ error: 'Invalid quiet_hours_end format. Use HH:MM' });
        }

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

    // Account deletion
    api.delete('/profile', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as { password: string; confirm: string };

        if (!body.password || typeof body.password !== 'string') {
          return reply.code(400).send({ error: 'Password is required' });
        }

        if (!body.confirm || body.confirm !== 'DELETE') {
          return reply.code(400).send({ error: 'Please type DELETE to confirm' });
        }

        const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(userId);

        if (getUserError || !user || !user.email) {
          server.log.error({ error: getUserError }, 'Failed to fetch user for deletion');
          return reply.code(500).send({ error: 'Failed to verify password' });
        }

        const { error: passwordError } = await supabaseAuth.auth.signInWithPassword({
          email: user.email,
          password: body.password
        });

        if (passwordError) {
          server.log.warn({ userId, error: passwordError }, 'Password verification failed for account deletion');
          return reply.code(401).send({ error: 'Incorrect password' });
        }

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

        const exportData = {
          exportDate: new Date().toISOString(),
          totalDecisions: decisions?.length || 0,
          decisions: decisions || [],
        };

        return exportData;
      } catch (error) {
        console.error('Export JSON error:', error);
        reply.code(500);
        return { error: 'Failed to export data' };
      }
    });

    // Audio recordings export
    api.post('/export/audio', async (request, reply) => {
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      try {
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

      try {
        const { data: outcomes, error: outcomesError } = await supabase
          .from('outcomes')
          .select('*')
          .eq('decision_id', id)
          .order('check_in_number', { ascending: true });

        if (outcomesError) {
          if (outcomesError.code === 'PGRST204' || outcomesError.code === 'PGRST205' ||
              outcomesError.code === '42P01' ||
              outcomesError.message?.includes('does not exist')) {
            server.log.warn('Outcomes table not found, using legacy single outcome format');

            const { data: decision, error: decisionError } = await supabase
              .from('decisions')
              .select('id, user_id, outcome, outcome_notes, outcome_recorded_at')
              .eq('id', id)
              .eq('user_id', userId)
              .is('deleted_at', null)
              .maybeSingle();

            if (decisionError || !decision) {
              reply.code(404);
              return { error: 'Not Found', message: 'Decision not found' };
            }

            if (decision.outcome) {
              return {
                outcomes: [{
                  id: decision.id,
                  result: decision.outcome,
                  notes: decision.outcome_notes,
                  recordedAt: decision.outcome_recorded_at,
                  check_in_number: 1
                }],
                decisionId: id
              };
            }

            return { outcomes: [], decisionId: id };
          }

          server.log.error(outcomesError);
          reply.code(500);
          return { error: 'Failed to fetch outcomes' };
        }

        return {
          outcomes: outcomes.map(o => ({
            id: o.id,
            result: o.result,
            satisfaction: o.satisfaction,
            notes: o.learned,
            recordedAt: o.recorded_at,
            check_in_number: o.check_in_number,
            scheduled_for: o.scheduled_for
          })),
          decisionId: id
        };

      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Internal server error' };
      }
    });

    api.post('/decisions/:id/outcomes', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;

      if (!userId) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      try {
        const body = request.body as { result?: string; satisfaction?: number; notes?: string; learned?: string } | null;

        if (!body) {
          reply.code(400);
          return { error: 'Request body is required' };
        }

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

        let outcome: string | undefined;
        if (body.result === 'positive' || body.result === 'better') {
          outcome = 'better';
        } else if (body.result === 'negative' || body.result === 'worse') {
          outcome = 'worse';
        } else if (body.result === 'neutral' || body.result === 'as_expected') {
          outcome = 'as_expected';
        } else if (body.result) {
          outcome = body.result;
        }

        if (!outcome) {
          reply.code(400);
          return { error: 'Result is required (better, worse, or as_expected)' };
        }

        try {
          const { data: existingOutcomes, error: queryError } = await supabase
            .from('outcomes')
            .select('check_in_number')
            .eq('decision_id', id)
            .order('check_in_number', { ascending: false })
            .limit(1);

          let nextCheckInNumber = 1;
          if (!queryError && existingOutcomes && existingOutcomes.length > 0) {
            nextCheckInNumber = existingOutcomes[0].check_in_number + 1;
          }

          const { data: newOutcome, error: insertError } = await supabase
            .from('outcomes')
            .insert({
              decision_id: id,
              result: outcome,
              satisfaction: body.satisfaction ?? null,
              learned: body.learned || body.notes || null,
              recorded_at: new Date().toISOString(),
              check_in_number: nextCheckInNumber
            })
            .select()
            .single();

          if (insertError) {
            if (insertError.code === 'PGRST204' || insertError.code === 'PGRST205' ||
                insertError.code === '42P01' ||
                insertError.message?.includes('does not exist')) {
              throw insertError;
            }
            server.log.warn('Outcomes table insert failed, falling back to legacy format');
            throw insertError;
          }

          return {
            success: true,
            outcome: {
              id: newOutcome.id,
              result: newOutcome.result,
              satisfaction: newOutcome.satisfaction,
              notes: newOutcome.learned,
              recordedAt: newOutcome.recorded_at,
              check_in_number: newOutcome.check_in_number
            }
          };

        } catch (tableError: any) {
          if (tableError.code === 'PGRST204' || tableError.code === 'PGRST205' ||
              tableError.code === '42P01' ||
              tableError.message?.includes('does not exist') ||
              tableError.message?.includes('outcomes')) {
            server.log.warn('Outcomes table not found, using legacy single outcome format');

            const { data: updated, error } = await supabase
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

            if (error?.code === 'PGRST116' || !updated) {
              reply.code(410);
              return { error: 'Gone', message: 'This decision has been deleted.', canRedirect: true };
            }

            if (error) throw error;

            return {
              success: true,
              outcome: {
                id: id,
                result: updated.outcome,
                satisfaction: body.satisfaction,
                notes: updated.outcome_notes,
                recordedAt: updated.outcome_recorded_at,
                check_in_number: 1
              }
            };
          }

          throw tableError;
        }
      } catch (error: any) {
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
          remind_at: string;
          timezone?: string;
        };

        if (!body.remind_at) {
          return reply.code(400).send({ error: 'remind_at is required' });
        }

        const remindAt = new Date(body.remind_at);
        if (isNaN(remindAt.getTime())) {
          return reply.code(400).send({ error: 'Invalid remind_at date format' });
        }

        const { data: decision, error: decisionError } = await supabase
          .from('decisions')
          .select('id, user_id, deleted_at')
          .eq('id', id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        if (decisionError || !decision) {
          return reply.code(410).send({
            error: 'Gone',
            message: 'This decision has been deleted.',
            canRedirect: true
          });
        }

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

    api.patch('/decisions/:id/reminders/:reminderId', async (request, reply) => {
      try {
        const { id, reminderId } = request.params as { id: string; reminderId: string };
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as { status?: string; remind_at?: string };

        const updateData: any = {};
        if (body.status) {
          updateData.status = body.status;
        }
        if (body.remind_at) {
          updateData.remind_at = body.remind_at;
        }

        const { data: reminder, error } = await supabase
          .from('DecisionsFollowUpReminders')
          .update(updateData)
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

    // Pending Reviews
    api.get('/pending-reviews', async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        const userMetadata = user?.user_metadata || {};

        const quietHoursStart = userMetadata.quiet_hours_start || '22:00';
        const quietHoursEnd = userMetadata.quiet_hours_end || '08:00';
        const quietHoursEnabled = userMetadata.quiet_hours_enabled !== false;

        const now = new Date();
        const userTimezone = userMetadata.timezone || 'UTC';

        const timeZoneFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        const currentTimeStr = timeZoneFormatter.format(now);

        const isCurrentlyQuietHours = quietHoursEnabled && isInQuietHours(currentTimeStr, quietHoursStart, quietHoursEnd);

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
          .is('outcome', null)
          .lte('follow_up_date', new Date().toISOString())
          .order('follow_up_date', { ascending: true });

        if (error) {
          server.log.error(error);
          return reply.code(500).send({ error: 'Failed to fetch pending reviews' });
        }

        let filteredDecisions = decisions || [];

        if (isCurrentlyQuietHours && quietHoursEnabled) {
          const todayQuietStart = getTodayTimeAt(quietHoursStart, userTimezone);

          const quietStartTimestamp = parseTimeString(quietHoursStart);
          const quietEndTimestamp = parseTimeString(quietHoursEnd);
          const spansMidnight = quietEndTimestamp < quietStartTimestamp;

          filteredDecisions = filteredDecisions.filter(decision => {
            const followUpAt = new Date(decision.follow_up_date);

            let shouldShow: boolean;

            if (spansMidnight) {
              const yesterdayQuietStart = new Date(todayQuietStart);
              yesterdayQuietStart.setDate(yesterdayQuietStart.getDate() - 1);
              shouldShow = followUpAt < yesterdayQuietStart;
            } else {
              shouldShow = followUpAt < todayQuietStart;
            }

            return shouldShow;
          });
        }

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

  return server;
}
