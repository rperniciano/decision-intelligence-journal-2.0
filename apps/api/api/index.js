import { buildApp } from '../src/app.js';
let app = null;
async function getApp() {
    if (!app) {
        app = await buildApp({ logger: true });
        await app.ready();
    }
    return app;
}
export default async function handler(req, res) {
    try {
        const fastify = await getApp();
        // Forward the request to Fastify
        await fastify.ready();
        // Use Fastify's inject to handle the request
        const response = await fastify.inject({
            method: req.method,
            url: req.url || '/',
            headers: req.headers,
            payload: req.body,
        });
        // Set response headers
        for (const [key, value] of Object.entries(response.headers)) {
            if (value) {
                res.setHeader(key, value);
            }
        }
        // Send the response
        res.status(response.statusCode).send(response.payload);
    }
    catch (error) {
        console.error('Handler error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
//# sourceMappingURL=index.js.map