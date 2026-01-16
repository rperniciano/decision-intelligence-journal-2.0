import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from 'dotenv';

// Load environment variables
config();

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
}

// Register routes
async function registerRoutes() {
  // Health check
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API version prefix
  server.register(async (api) => {
    // Decisions endpoints
    api.get('/decisions', async (request, reply) => {
      // TODO: Implement decision list with filters
      return { decisions: [], total: 0, page: 1, limit: 20 };
    });

    api.get('/decisions/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      // TODO: Implement single decision fetch
      return { id, message: 'Decision endpoint - to be implemented' };
    });

    api.post('/decisions', async (request, reply) => {
      // TODO: Implement decision creation
      return { message: 'Create decision - to be implemented' };
    });

    api.patch('/decisions/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      // TODO: Implement decision update
      return { message: 'Update decision - to be implemented' };
    });

    api.delete('/decisions/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      // TODO: Implement soft delete
      return { message: 'Delete decision - to be implemented' };
    });

    // Recording endpoints
    api.post('/recordings/upload', async (request, reply) => {
      // TODO: Implement audio upload
      return { message: 'Upload endpoint - to be implemented' };
    });

    api.post('/recordings/:id/process', async (request, reply) => {
      const { id } = request.params as { id: string };
      // TODO: Implement processing trigger
      return { message: 'Process endpoint - to be implemented' };
    });

    api.get('/recordings/:id/status', async (request, reply) => {
      const { id } = request.params as { id: string };
      // TODO: Implement status polling
      return { status: 'pending', progress: 0 };
    });

    // Categories
    api.get('/categories', async () => {
      // TODO: Implement categories list
      return { categories: [] };
    });

    // Insights
    api.get('/insights', async () => {
      // TODO: Implement insights
      return {
        score: 50,
        patterns: {
          timing: null,
          emotional: null,
          categories: null,
        },
        summary: null,
      };
    });

    // Profile
    api.get('/profile', async () => {
      // TODO: Implement profile fetch
      return { message: 'Profile endpoint - to be implemented' };
    });

    api.patch('/profile', async () => {
      // TODO: Implement profile update
      return { message: 'Profile update - to be implemented' };
    });

    // Export
    api.post('/export/json', async () => {
      // TODO: Implement JSON export
      return { message: 'Export JSON - to be implemented' };
    });

    api.post('/export/csv', async () => {
      // TODO: Implement CSV export
      return { message: 'Export CSV - to be implemented' };
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
