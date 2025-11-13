import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';

// Pool configuration
const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'seo_keyword_tool',
  max: parseInt(process.env.DB_POOL_SIZE || '20'), // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Create the connection pool
export const pool = new Pool(poolConfig);

// Error handling for idle clients
pool.on('error', (err: Error) => {
  console.error('❌ Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('✓ New PostgreSQL client connected to pool');
});

/**
 * Initialize database connection with retry logic
 */
export async function initializeDatabase(retries = 5, delay = 3000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as now, version() as version');
      client.release();

      console.log('✓ PostgreSQL connected successfully');
      console.log(`  Database: ${poolConfig.database}`);
      console.log(`  Host: ${poolConfig.host}:${poolConfig.port}`);
      console.log(`  Server time: ${result.rows[0].now}`);
      console.log(`  Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);

      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, error instanceof Error ? error.message : error);

      if (attempt === retries) {
        console.error('❌ Failed to connect to database after all retries');
        throw error;
      }

      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    console.log('✓ PostgreSQL connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
    throw error;
  }
}

/**
 * Execute a query with automatic error handling
 */
export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('Query executed:', { text, duration: `${duration}ms`, rows: result.rowCount });
    }

    return result;
  } catch (error) {
    console.error('Database query error:', {
      text,
      params,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check database health
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  details?: any;
}> {
  try {
    await pool.query('SELECT 1 as health');
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };

    return {
      status: 'healthy',
      message: 'Database connection is healthy',
      details: poolStats,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper function to check if database is ready
 */
export async function isDatabaseReady(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
}
