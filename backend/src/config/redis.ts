import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis connection with retry logic
 */
export async function initializeRedis(retries = 5, delay = 3000): Promise<RedisClientType> {
  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('❌ Redis max reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        // Exponential backoff
        return Math.min(retries * 100, 3000);
      },
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  // Event handlers
  client.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('✓ Redis client connecting...');
  });

  client.on('ready', () => {
    console.log('✓ Redis client ready');
  });

  client.on('reconnecting', () => {
    console.log('⏳ Redis client reconnecting...');
  });

  client.on('end', () => {
    console.log('✓ Redis connection closed');
  });

  // Connect with retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await client.connect();

      // Test connection
      await client.ping();

      const info = await client.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1];

      console.log('✓ Redis connected successfully');
      console.log(`  Host: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
      console.log(`  Version: ${version || 'unknown'}`);

      redisClient = client;
      return client;
    } catch (error) {
      console.error(`❌ Redis connection attempt ${attempt}/${retries} failed:`, error instanceof Error ? error.message : error);

      if (attempt === retries) {
        console.error('❌ Failed to connect to Redis after all retries');
        throw error;
      }

      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Failed to connect to Redis');
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      console.log('✓ Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error);
      throw error;
    }
  }
}

/**
 * Cache helper - Set value with expiration
 */
export async function setCache(
  key: string,
  value: any,
  expirationSeconds?: number
): Promise<void> {
  const client = getRedisClient();
  const serialized = JSON.stringify(value);

  if (expirationSeconds) {
    await client.setEx(key, expirationSeconds, serialized);
  } else {
    await client.set(key, serialized);
  }
}

/**
 * Cache helper - Get value
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const value = await client.get(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Error parsing cached value:', error);
    return null;
  }
}

/**
 * Cache helper - Delete value
 */
export async function deleteCache(key: string): Promise<boolean> {
  const client = getRedisClient();
  const result = await client.del(key);
  return result > 0;
}

/**
 * Cache helper - Delete multiple keys matching pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  const keys = await client.keys(pattern);

  if (keys.length === 0) {
    return 0;
  }

  return await client.del(keys);
}

/**
 * Cache helper - Check if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  const client = getRedisClient();
  const result = await client.exists(key);
  return result === 1;
}

/**
 * Cache helper - Set expiration on existing key
 */
export async function setCacheExpiration(key: string, seconds: number): Promise<boolean> {
  const client = getRedisClient();
  return await client.expire(key, seconds);
}

/**
 * Cache helper - Get TTL (time to live) for a key
 */
export async function getCacheTTL(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.ttl(key);
}

/**
 * Cache helper - Increment a counter
 */
export async function incrementCache(key: string, amount = 1): Promise<number> {
  const client = getRedisClient();
  return await client.incrBy(key, amount);
}

/**
 * Cache helper - Decrement a counter
 */
export async function decrementCache(key: string, amount = 1): Promise<number> {
  const client = getRedisClient();
  return await client.decrBy(key, amount);
}

/**
 * Health check for Redis
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  details?: any;
}> {
  try {
    if (!redisClient) {
      return {
        status: 'unhealthy',
        message: 'Redis client not initialized',
      };
    }

    const start = Date.now();
    await redisClient.ping();
    const latency = Date.now() - start;

    const info = await redisClient.info('stats');
    const totalConnections = info.match(/total_connections_received:(\d+)/)?.[1];
    const connectedClients = info.match(/connected_clients:(\d+)/)?.[1];

    return {
      status: 'healthy',
      message: 'Redis connection is healthy',
      details: {
        latency: `${latency}ms`,
        totalConnections,
        connectedClients,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if Redis is ready
 */
export async function isRedisReady(): Promise<boolean> {
  try {
    if (!redisClient) {
      return false;
    }
    await redisClient.ping();
    return true;
  } catch (error) {
    return false;
  }
}
