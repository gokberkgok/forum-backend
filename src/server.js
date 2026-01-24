// ====================================================
// SERVER ENTRY POINT
// ====================================================
// Starts the Fastify server with graceful shutdown.

import app, { initApp } from './app.js';
import config from './config/index.js';
import logger from './utils/logger.js';
import prisma from './config/database.js';

const start = async () => {
  try {
    // Initialize app with plugins
    await initApp();

    // Start server
    await app.listen({ 
      port: config.port, 
      host: config.host 
    });

    logger.info(
      {
        port: config.port,
        host: config.host,
        env: config.env,
      },
      `🚀 Server running on http://${config.host}:${config.port}`
    );
  } catch (err) {
    logger.error({ error: err, message: err.message, stack: err.stack }, 'Error starting server');
    console.error('Startup error:', err);
    process.exit(1);
  }
};

// ====================================================
// GRACEFUL SHUTDOWN
// ====================================================

const gracefulShutdown = async (signal) => {
  logger.info({ signal }, 'Received shutdown signal');

  try {
    // Close Fastify server
    await app.close();
    logger.info('HTTP server closed');

    // Disconnect from database
    await prisma.$disconnect();
    logger.info('Database connection closed');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught Exception');
  process.exit(1);
});

// Start the server
start();

export default app;
