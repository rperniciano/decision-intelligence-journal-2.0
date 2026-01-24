// Vercel Serverless Entry Point
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any = null;

async function getApp() {
  if (!app) {
    // Check required environment variables first
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missing = requiredEnvVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    // Dynamic import with .js extension for ESM compatibility
    const { buildApp } = await import('../src/app.js');
    app = await buildApp({ logger: true });
    await app.ready();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const fastify = await getApp();

    // Forward the request to Fastify
    await fastify.ready();

    // Use Fastify's inject to handle the request
    const response = await fastify.inject({
      method: req.method as any,
      url: req.url || '/',
      headers: req.headers as any,
      payload: req.body,
    });

    // Set response headers
    for (const [key, value] of Object.entries(response.headers)) {
      if (value) {
        res.setHeader(key, value as string);
      }
    }

    // Send the response
    res.status(response.statusCode).send(response.payload);
  } catch (error: any) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined
    });
  }
}
