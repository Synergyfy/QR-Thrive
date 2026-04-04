const { bootstrap } = require('../apps/api/dist/main');

let cachedServer;

module.exports = async (req, res) => {
    if (!cachedServer) {
        cachedServer = await bootstrap();
    }
    
    // Split the URL to remove query parameters for path comparison
    const [path] = req.url.split('?');
    
    // If Vercel rewrites /api/v1/something to /api/server.js, 
    // the req.url might still be /api/v1/something.
    // If we removed setGlobalPrefix('api/v1') in NestJS, 
    // we need to ensure req.url matched by Express DOES NOT have the prefix.
    
    if (req.url.startsWith('/api/v1')) {
        req.url = req.url.replace('/api/v1', '') || '/';
    }
    
    return cachedServer(req, res);
};
