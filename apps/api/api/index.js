const { bootstrap } = require('../dist/main');

let cachedServer;

module.exports = async (req, res) => {
    if (!cachedServer) {
        cachedServer = await bootstrap();
    }
    
    return cachedServer(req, res);
};
