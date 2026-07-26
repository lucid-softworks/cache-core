export type MaybePromise<T> = T | PromiseLike<T>;

export type CacheRecord<T> = Readonly<{
  value: T;
  createdAt: number;
  freshUntil: number;
  staleUntil: number;
  tags: readonly string[];
}>;

export type CacheRecordOptions = Readonly<{
  ttl: number;
  staleWhileRevalidate?: number;
  now?: number;
  tags?: readonly string[];
}>;

export type CacheRecordStatus = "fresh" | "stale" | "expired";

export interface CacheStore<T = unknown> {
  get(key: string): MaybePromise<CacheRecord<T> | undefined>;
  set(key: string, record: CacheRecord<T>): MaybePromise<void>;
  delete(key: string): MaybePromise<boolean>;
}

export interface ClearableCacheStore<T = unknown> extends CacheStore<T> {
  clear(): MaybePromise<void>;
}

function duration(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError(`${name} must be finite and non-negative`);
  return value;
}

function normalizeTags(tags: readonly string[]): string[] {
  const normalized = new Set<string>();
  for (const tag of tags) {
    if (tag.length === 0) throw new TypeError("cache tags cannot be empty");
    normalized.add(tag);
  }
  return [...normalized];
}

export function createCacheRecord<T>(
  value: T,
  options: CacheRecordOptions,
): CacheRecord<T> {
  const ttl = duration(options.ttl, "ttl");
  const stale = duration(
    options.staleWhileRevalidate ?? 0,
    "staleWhileRevalidate",
  );
  const now = options.now ?? Date.now();
  if (!Number.isFinite(now)) throw new RangeError("now must be finite");
  return {
    createdAt: now,
    freshUntil: now + ttl,
    staleUntil: now + ttl + stale,
    tags: normalizeTags(options.tags ?? []),
    value,
  };
}

export function cacheRecordStatus(
  record: CacheRecord<unknown>,
  now: number = Date.now(),
): CacheRecordStatus {
  if (now < record.freshUntil) return "fresh";
  return now < record.staleUntil ? "stale" : "expired";
}
