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

    api.post('/categories', async (request) => {
      const userId = request.user?.id;
      // TODO: Implement category creation
      return { message: 'Create category - to be implemented', userId };
    });

    api.patch('/categories/:id', async (request) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      // TODO: Implement category update (verify ownership)
      return { message: 'Update category - to be implemented', id, userId };
    });

    api.delete('/categories/:id', async (request) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;
      // TODO: Implement category delete (verify ownership)
      return { message: 'Delete category - to be implemented', id, userId };
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

    api.patch('/profile', async (request) => {
      const userId = request.user?.id;
      // TODO: Implement profile update
      return { message: 'Profile update - to be implemented', userId };
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
