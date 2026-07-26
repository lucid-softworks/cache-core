# `@lucid-softworks/cache-core`

Shared cache records and minimal sync-or-async store contracts. Records carry
explicit fresh and stale deadlines plus deduplicated invalidation tags.

```ts
import { createCacheRecord } from "@lucid-softworks/cache-core";

const profile = { id: "user-42", name: "Ada" };
const record = createCacheRecord(profile, {
  ttl: 60_000,
  staleWhileRevalidate: 300_000,
  tags: [`user:${profile.id}`],
});
```

Expiration is represented in the record rather than hidden in the store, so
all adapters and policies apply the same boundary semantics.
