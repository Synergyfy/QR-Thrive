const { bootstrap } = require('../apps/api/dist/main');

let cachedServer;

module.exports = async (req, res) => {
    // Vercel rewrites often change the URL that NestJS sees.
    // Ensure that NestJS receives the full URL including /api/v1 
    // or that it's correctly handled via globalPrefix.
    if (!cachedServer) {
        cachedServer = await bootstrap();
    }
    return cachedServer(req, res);
};
