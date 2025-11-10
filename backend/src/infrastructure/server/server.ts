import { createApp } from './app';
import { prisma } from '../db/prismaClient';

const PORT = process.env.PORT || 3001;

/**
 * Start the Express server
 */
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API endpoints:`);
      console.log(`   GET  /routes`);
      console.log(`   POST /routes/:routeId/baseline`);
      console.log(`   GET  /routes/comparison`);
      console.log(`   GET  /compliance/cb`);
      console.log(`   GET  /compliance/adjusted-cb`);
      console.log(`   GET  /banking/records`);
      console.log(`   POST /banking/bank`);
      console.log(`   POST /banking/apply`);
      console.log(`   POST /pools`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();

