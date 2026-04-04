const path = require('path');
const { bootstrap } = require('../apps/api/dist/main');

let cachedServer;

module.exports = async (req, res) => {
    // Debugging logs - Check these in the "Functions" tab in Vercel
    console.log(`[API REQUEST] - URL: ${req.url} - Method: ${req.method}`);

    // Health check endpoint for easy verification
    if (req.url.endsWith('/ping')) {
        return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }
    
    if (!cachedServer) {
        console.log('[API BOOTSTRAP] - Initializing NestJS App...');
        cachedServer = await bootstrap();
    }
    
    return cachedServer(req, res);
};
