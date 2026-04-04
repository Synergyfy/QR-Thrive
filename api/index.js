const path = require('path');
const { bootstrap } = require('../apps/api/dist/main');

let cachedServer;

module.exports = async (req, res) => {
    // Debugging logs - Check these in the "Functions" tab in Vercel
    console.log(`[API REQUEST] - URL: ${req.url} - Method: ${req.method}`);
    
    if (!cachedServer) {
        console.log('[API BOOTSTRAP] - Initializing NestJS App...');
        cachedServer = await bootstrap();
    }
    
    // Ensure that the URL passed to NestJS is exactly what it was called with.
    // If we have app.setGlobalPrefix('api/v1') in main.ts, 
    // NestJS expects req.url to contain /api/v1/...
    // Since our rewrite is source: /api/v1/:path* -> destination: /api/index.js,
    // we must ensure req.url is handled correctly.
    
    return cachedServer(req, res);
};
