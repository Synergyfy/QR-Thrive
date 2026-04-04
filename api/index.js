const { bootstrap } = require('../apps/api/dist/main');

let cachedServer;

module.exports = async (req, res) => {
    if (!cachedServer) {
        cachedServer = await bootstrap();
    }
    
    // Ensure the request headers and URL are passed through correctly
    // Express will use req.url for routing.
    return cachedServer(req, res);
};
