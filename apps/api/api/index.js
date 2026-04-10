const { bootstrap } = require('../dist/main');

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://qrthrive.vercel.app',
    'https://www.qrthrive.com',
    'https://test.qrthrive.com'
];

let cachedServer;

module.exports = async (req, res) => {
    const origin = req.headers.origin;

    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    }

    // Handle preflight requests immediately for better performance
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Health check endpoint for easy verification
    if (req.url.endsWith('/ping')) {
        return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), info: 'Standalone API Alive' });
    }

    if (!cachedServer) {
        cachedServer = await bootstrap();
    }
    
    return cachedServer(req, res);
};
