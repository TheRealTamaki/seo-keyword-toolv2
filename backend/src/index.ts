import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase, healthCheck as dbHealthCheck } from './config/database';
import { initializeRedis, closeRedis, healthCheck as redisHealthCheck } from './config/redis';
import { initializeSupabase, healthCheck as supabaseHealthCheck } from './config/supabase';
import { initializeQueues, closeQueues } from './config/queue';
import { initializeWorkers } from './jobs/worker';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check endpoint
app.get('/health/detailed', async (_req, res) => {
  const database = await dbHealthCheck();
  const redis = await redisHealthCheck();
  const supabase = await supabaseHealthCheck();

  const overallStatus =
    database.status === 'healthy' &&
    redis.status === 'healthy' &&
    supabase.status === 'healthy'
      ? 'healthy'
      : 'unhealthy';

  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date(),
    services: {
      database,
      redis,
      supabase,
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API routes
app.use('/api/auth', require('./api/auth.routes'));
app.use('/api/dashboard', require('./api/dashboard.routes'));
app.use('/api/projects', require('./api/projects.routes'));
app.use('/api/keywords', require('./api/keywords.routes'));
app.use('/api/rankings', require('./api/rankings.routes'));
app.use('/api/competitors', require('./api/competitors.routes'));
app.use('/api/api-keys', require('./api/api-keys.routes'));
app.use('/api/jobs', require('./api/jobs.routes'));
app.use('/api/keyword-research', require('./api/keyword-research.routes'));
app.use('/api/keyword-lists', require('./api/keyword-lists.routes'));
app.use('/api/competitor-analysis', require('./api/competitor-analysis.routes'));
app.use('/api/alerts', require('./api/alerts.routes'));
app.use('/api/exports', require('./api/exports.routes'));
app.use('/api/reports', require('./api/reports.routes'));

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
async function start() {
  try {
    // Initialize services
    await initializeDatabase();
    await initializeRedis();
    await initializeSupabase();

    // Initialize job queues and workers
    initializeQueues();
    initializeWorkers();

    // Start listening
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('✓ Job queue and workers initialized');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
  await closeQueues();
  await closeDatabase();
  await closeRedis();
  process.exit(0);
});

start();

export default app;
