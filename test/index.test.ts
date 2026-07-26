import { describe, expect, it } from "vitest";

import {
  cacheRecordStatus,
  createCacheRecord,
  type CacheStore,
} from "../src/index.js";

describe("cache core", () => {
  it("creates records with normalized tags and freshness windows", () => {
    const record = createCacheRecord(undefined, {
      now: 10,
      staleWhileRevalidate: 5,
      tags: ["users", "users", "tenant:1"],
      ttl: 20,
    });
    expect(record).toEqual({
      createdAt: 10,
      freshUntil: 30,
      staleUntil: 35,
      tags: ["users", "tenant:1"],
      value: undefined,
    });
    expect(cacheRecordStatus(record, 29)).toBe("fresh");
    expect(cacheRecordStatus(record, 30)).toBe("stale");
    expect(cacheRecordStatus(record, 35)).toBe("expired");
  });

  it("supports defaults and structural synchronous stores", () => {
    const record = createCacheRecord("value", { ttl: 0 });
    expect(record.createdAt).toBeTypeOf("number");
    expect(record.tags).toEqual([]);
    const values = new Map();
    const store: CacheStore<string> = {
      delete: (key) => values.delete(key),
      get: (key) => values.get(key),
      set: (key, value) => {
        values.set(key, value);
      },
    };
    store.set("key", record);
    expect(store.get("key")).toBe(record);
    expect(store.delete("key")).toBe(true);
  });

  it.each([
    [{ ttl: -1 }, "ttl"],
    [{ staleWhileRevalidate: -1, ttl: 1 }, "staleWhileRevalidate"],
    [{ now: Number.NaN, ttl: 1 }, "now"],
    [{ tags: [""], ttl: 1 }, "tags"],
  ])("rejects invalid record options", (options, message) => {
    expect(() => createCacheRecord("value", options)).toThrow(message);
  });
});
