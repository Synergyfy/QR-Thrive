const { bootstrap } = require('../dist/main');

let cachedServer;

module.exports = async (req, res) => {
    // Health check endpoint for easy verification
    if (req.url.endsWith('/ping')) {
        return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), info: 'Standalone API Alive' });
    }

    if (!cachedServer) {
        cachedServer = await bootstrap();
    }
    
    return cachedServer(req, res);
};
