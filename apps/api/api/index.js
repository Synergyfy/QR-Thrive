const main = require('../dist/main');

// Create a variable to cache the server instance
let cachedServer;

module.exports = async (req, res) => {
    // If the server isn't initialized yet, create it
    if (!cachedServer) {
        // Grab the exported bootstrap function from main.ts
        const bootstrap = main.bootstrap || main.default || main;
        cachedServer = await bootstrap();
    }

    // Pass the Vercel request and response to the Express instance
    return cachedServer(req, res);
};