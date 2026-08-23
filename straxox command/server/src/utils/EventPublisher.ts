import Redis from 'ioredis';
import { logger } from './logger';

export interface StraxonEvent {
  eventType: string;
  version: 'v1';
  traceId?: string;
  timestamp: number;
  payload: any;
  room?: string;
}

export class EventPublisher {
  private pubClient: Redis;
  private channel = 'straxon:events:v1';

  constructor() {
    this.pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  public async publish(eventType: string, payload: any, traceId?: string, room?: string) {
    const event: StraxonEvent = {
      eventType,
      version: 'v1',
      traceId,
      timestamp: Date.now(),
      payload,
      room,
    };

    try {
      await this.pubClient.publish(this.channel, JSON.stringify(event));
    } catch (err) {
      logger.error({ err, event }, 'Failed to publish event to Redis');
    }
  }

  public getClient() {
    return this.pubClient;
  }
}

export const eventPublisher = new EventPublisher();
