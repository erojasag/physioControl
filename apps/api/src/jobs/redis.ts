import IORedis, { type Redis } from "ioredis";
import { loadConfig } from "../config/config";

export const REMINDERS_QUEUE_PROVIDER = Symbol("REMINDERS_QUEUE");

// BullMQ requires maxRetriesPerRequest: null on its connection.
export function makeRedisConnection(): Redis {
  return new IORedis(loadConfig().REDIS_URL, { maxRetriesPerRequest: null });
}
