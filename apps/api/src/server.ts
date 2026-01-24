// Local development server entry point
// For Vercel deployment, see api/index.ts
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildApp } from './app.js';
import { reminderJob } from './services/reminderBackgroundJob.js';

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from monorepo root
config({ path: path.resolve(__dirname, '../../../.env') });

// Start server
async function start() {
  try {
    const server = await buildApp({
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

    const port = parseInt(process.env.API_PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });

    // Start background job for due reminder notifications (local dev only)
    const reminderInterval = parseInt(process.env.REMINDER_CHECK_INTERVAL_MS || '60000', 10);
    reminderJob.start(reminderInterval);

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Decisions API Server                                    ║
║   ────────────────────────────────────────────────────    ║
║                                                           ║
║   Server running at http://localhost:${port}            ║
║   Health check: http://localhost:${port}/health         ║
║   API: http://localhost:${port}/api/v1                  ║
║                                                           ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(27)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
