import { PrismaClient, Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import Redis from "ioredis";

// To avoid creating a new pool on every HMR/module reload, we use a singleton
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/straxon_v2?schema=public";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const redisCache = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const basePrisma = new PrismaClient({ adapter });

const AUDITED_MODELS = ["Deal", "Invoice", "Project", "Proposal", "Client"];

// Helper to log audit events
const logAuditEvent = async (model: string, operation: string, args: any) => {
  if (!AUDITED_MODELS.includes(model)) return;
  
  try {
    // Attempt to extract org ID and user ID if available (this assumes they are passed in args.data or where)
    const organizationId = args.data?.organizationId || args.where?.organizationId || "SYSTEM";
    const entityId = args.where?.id || "NEW_ENTITY";
    
    // We defer the actual insert so we don't block the main query
    basePrisma.auditLogEntry.create({
      data: {
        userId: "SYSTEM_HOOK", // In a real setup, we'd pass context via cls-hooked or AsyncLocalStorage
        action: `${operation.toUpperCase()}_${model.toUpperCase()}`,
        entityType: model,
        entityId: entityId,
        metadata: { args: JSON.stringify(args) },
        organizationId: organizationId
      }
    }).catch(err => console.error("Async audit log failed:", err));
  } catch (error) {
    console.error("Failed to generate audit log entry:", error);
  }
};

const invalidateCache = async (model: string) => {
  const pattern = `prisma:cache:${model}:*`;
  // Using keys is fine for small/medium datasets, but scan is safer for prod.
  // We'll use a simple stream for safety
  const stream = redisCache.scanStream({ match: pattern, count: 100 });
  stream.on("data", (resultKeys) => {
    if (resultKeys.length) {
      redisCache.unlink(resultKeys);
    }
  });
};

export const prisma = basePrisma.$extends({
  model: {
    $allModels: {
      async cachedFindMany(args: any, ttl = 60) {
        const context = Prisma.getExtensionContext(this);
        const cacheKey = `prisma:cache:${(context as any).$name}:${JSON.stringify(args)}`;
        const cached = await redisCache.get(cacheKey);
        if (cached) return JSON.parse(cached);
        const result = await (context as any).findMany(args);
        await redisCache.setex(cacheKey, ttl, JSON.stringify(result));
        return result;
      },
      async cachedAggregate(args: any, ttl = 60) {
        const context = Prisma.getExtensionContext(this);
        const cacheKey = `prisma:cache:aggregate:${(context as any).$name}:${JSON.stringify(args)}`;
        const cached = await redisCache.get(cacheKey);
        if (cached) return JSON.parse(cached);
        const result = await (context as any).aggregate(args);
        await redisCache.setex(cacheKey, ttl, JSON.stringify(result));
        return result;
      }
    }
  },
  query: {
    $allModels: {
      async create({ model, operation, args, query }) {
        await invalidateCache(model);
        logAuditEvent(model, operation, args);
        return query(args);
      },
      async update({ model, operation, args, query }) {
        await invalidateCache(model);
        logAuditEvent(model, operation, args);
        return query(args);
      },
      async updateMany({ model, operation, args, query }) {
        await invalidateCache(model);
        logAuditEvent(model, operation, args);
        return query(args);
      },
      async upsert({ model, operation, args, query }) {
        await invalidateCache(model);
        logAuditEvent(model, operation, args);
        return query(args);
      },
      async delete({ model, operation, args, query }) {
        await invalidateCache(model);
        logAuditEvent(model, operation, args);
        return query(args);
      },
      async deleteMany({ model, operation, args, query }) {
        await invalidateCache(model);
        logAuditEvent(model, operation, args);
        return query(args);
      }
    }
  }
});
