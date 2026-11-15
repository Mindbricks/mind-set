# IngestionSettings

**Level:** `section` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [IngestionSettings in Part 1](../ontology/IngestionSettings.md)

The write-path tuning for an EventStream (see the family's design record, §5). Governs the thin, fast, async batched insert the generated ingest handler performs — batching cadence, dedup, rate limit, shedding. The handler does auth → schema-validate → (dedup) → enqueue/batch → fast return; NO heavy per-row work runs here (that belongs in the compute layer or the Spark cleaning stage).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `batchSize` | `Integer` | no | `200` |  |  | Number of records the ingest handler accumulates before flushing one batched insert to the hot store. Larger = fewer round-trips / higher throughput; smaller = lower latency. Defaults to a balanced value. |
| `flushIntervalMs` | `Integer` | no | `1000` |  |  | Maximum milliseconds a partial batch waits before it is flushed regardless of batchSize (so low-rate streams still land promptly). Defaults to a small value. |
| `idempotencyKey` | `String` | no |  |  |  | Optional name of an eventSchema field used as the dedup/idempotency key. When set, the handler drops a record whose key was already seen in the dedup window (atLeastOnce → effectively once). Null = no dedup. |
| `rateLimitPerSecond` | `Integer` | no |  |  |  | Optional per-client ingest rate cap (records/sec), enforced as a fixed per-second window in-memory per instance. The client key is the authenticated session user id when present, else the remote IP. Over the cap the handler rejects with HTTP 429 and a Retry-After header (seconds). Null = no ingest-side rate limit. |
| `loginRequired` | `Boolean` | no | `false` |  |  | When true, `POST /ingest/<stream>` requires a valid login token and answers an anonymous caller 401 LOGIN_REQUIRED. Defaults to false, which keeps the ingest open (unauthenticated device telemetry); in a multi-tenant project an open ingest raises a design-time warning (EVENTSTREAM_INGEST_OPEN_MULTI_TENANT). |
| `actorField` | `String` | no |  |  |  | Optional name of an eventSchema field the ingest handler stamps with the caller's session `userId`. The value the client sent in that field is always discarded; an anonymous caller leaves it empty. Null = no actor stamping. |
| `sessionField` | `String` | no |  |  |  | Optional name of an eventSchema field the ingest handler stamps with the caller's session `sessionId`. The value the client sent in that field is always discarded; an anonymous caller leaves it empty. Null = no session stamping. |
| `tenantField` | `String` | no |  |  |  | [multi-tenant] Optional name of an eventSchema field that carries the tenant. The ingest handler stamps it with the caller's session tenant (`<tenantName>Id`) and discards the client value, and every read surface of the stream is tenant-scoped: when it is the partition key, a caller reads only the partition named by its own tenant; otherwise only the rows whose tenant equals its own. A caller with no session tenant is refused (403 TENANT_SCOPE_REQUIRED). Null = the stream is not tenant-scoped (warned in a multi-tenant project: EVENTSTREAM_NOT_TENANT_SCOPED). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
