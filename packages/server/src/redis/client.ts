import Redis from 'ioredis';

export function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  // Upstash and other cloud Redis providers use rediss:// (TLS)
  if (redisUrl.startsWith('rediss://')) {
    return new Redis(redisUrl, {
      tls: {},
    });
  }

  return new Redis(redisUrl);
}
