# BigLoadStoreConfig

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [BigLoadStoreConfig in Part 1](../ontology/BigLoadStoreConfig.md)

Big-load datastore connection credentials and defaults. Fields are a flat superset across all engine types — only those relevant to the selected `engine` are read at runtime and emitted to env. `password` and `secretAccessKey` are secret (masked in API responses).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `contactPoints` | `String` | no |  |  |  | [cassandra] Comma-separated host:port contact points. `localhost`, `127.0.0.1`, and `[::1]` are local-development-only endpoints (for example, FARM `localhost:19042`); leave this blank to use the managed endpoint, or provide a reachable remote endpoint for deployed services. |
| `localDataCenter` | `String` | no |  |  |  | [cassandra] The local data-center name the driver pins to, e.g. `datacenter1`. |
| `keyspace` | `String` | no |  |  |  | [cassandra] The keyspace the big-load tables live in, baked into generated stream descriptors. Auto-created on boot when absent. No BIGLOAD_*_KEYSPACE runtime override is emitted. |
| `url` | `String` | no |  |  |  | [clickhouse] The HTTP endpoint. `localhost`, `127.0.0.1`, and `[::1]` are local-development-only endpoints (for example, FARM `http://localhost:18123`); leave this blank to use the managed endpoint, or provide a reachable remote endpoint for deployed services. |
| `database` | `String` | no |  |  |  | [clickhouse] The database the analytics tables live in. Defaults to the server default when absent. |
| `username` | `String` | no |  |  |  | [cassandra\|clickhouse] The store username (e.g. cassandra `cassandra`, clickhouse `default`). |
| `password` | `String` | no |  |  | **secret** | [cassandra\|clickhouse] The store password. Secret — masked in API responses and emitted to BIGLOAD_<NAME>_PASSWORD at codegen time. |
| `bucket` | `String` | no |  |  |  | [s3Parquet] The S3 bucket name for the cold Parquet archive. |
| `region` | `String` | no |  |  |  | [s3Parquet] The S3 region, e.g. `us-east-1`. |
| `prefix` | `String` | no |  |  |  | [s3Parquet] Optional key prefix under which Parquet objects are written. |
| `endpoint` | `String` | no |  |  |  | [s3Parquet] Optional S3-compatible endpoint (Cloudflare R2 / SeaweedFS / MinIO). Omit for AWS S3. |
| `accessKeyId` | `String` | no |  |  |  | [s3Parquet] The S3 access key id. |
| `secretAccessKey` | `String` | no |  |  | **secret** | [s3Parquet] The S3 secret access key. Secret — masked in API responses and emitted to BIGLOAD_<NAME>_SECRETACCESSKEY at codegen time. |
| `host` | `String` | no |  |  |  | Reserved legacy field; the redis big-load engine is retired and has no runtime. |
| `port` | `Integer` | no |  |  |  | Reserved legacy field; the redis big-load engine is retired and has no runtime. |
| `livyUrl` | `String` | no |  |  |  | [spark] The Apache Livy REST endpoint the cleaningPipeline orchestration client submits/polls batches against, e.g. `http://localhost:18998`. FARM default = http://localhost:18998. (A Spark-Connect gRPC endpoint would also live here if that transport is selected.) |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
