import Redis from 'ioredis';

// Connect to Redis (assuming localhost:6379, modify if running in Docker)
const redis = new Redis('redis://localhost:6379');

console.log('Starting Straxon Pulse metrics simulator...');

function generateMetrics() {
  // Simulate some realistic-looking metrics with slight variations
  const baseCpu = 25 + Math.random() * 15;
  const baseMem = 45 + Math.random() * 5;
  const baseReq = 120 + Math.floor(Math.random() * 50);
  const baseLat = 45 + Math.random() * 20;

  return {
    cpuUsage: baseCpu,
    memoryUsage: baseMem,
    activeConnections: Math.floor(baseReq * 1.5),
    requestsPerSecond: baseReq,
    latencyMs: baseLat
  };
}

setInterval(() => {
  const metrics = generateMetrics();
  // The Go server expects just the raw JSON object, which it wraps in an event
  redis.publish('straxon:metrics', JSON.stringify(metrics))
    .catch(err => console.error('Redis publish error:', err));
  
  process.stdout.write(`\rPublished pulse: ${metrics.cpuUsage.toFixed(1)}% CPU | ${metrics.requestsPerSecond} req/s`);
}, 1000);

process.on('SIGINT', () => {
  console.log('\nStopping simulator...');
  redis.quit();
  process.exit();
});
