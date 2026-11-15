# JobStream

**Level:** `chapter` · **Family:** [JobStream](../ontology/families.md#jobstream) (domain `Service`)

**Ontology:** [JobStream in Part 1](../ontology/JobStream.md)

**Name:** an instance is named by `streamBasics.name`.

An async-job-orchestration pattern (docs/ADR-async-job-orchestration-patterns.md). A `JobStream` is a durable, reconnectable, observable async BUSINESS job that GENERALIZES `ComputeJob`: it reuses ComputeJob's durable event-outbox + reconnectable SSE-tail machinery, but the 'work' is a **BusinessApi invocation** (not a native compute kernel). deliveryMode is `push` (a worker drains a Kafka work topic and calls the target API; the target needs no change). From ONE declaration codegen emits: an enqueue edge (produce → job topic + create the job record + return jobId), a Kafka-consumer WORKER controller on the target BusinessApi bound to that topic, a durable per-job event outbox, and a reconnectable SSE observation edge keyed by jobId — AND it SUPPRESSES the target BusinessApi's public REST route (binding-as-JobStream-target ⇒ internal by default; `targetApi.keepPublicRoute` re-exposes it). Clients enter through the enqueue and SSE observation edges. Server-side code in the same service can call `enqueueJobStream(name, input, { session, requestId })` from the generated job-stream-layer barrel; it runs the same enqueue gate against the supplied session and creates the same durable job row and work message as the REST enqueue route. Suppression is REST-ONLY: a target that ALSO declares a gRPC, SSE or kafka controller keeps that transport mounted with its own auth posture, so 'reachable only via the worker' holds when REST is the api's sole transport. Lifecycle: queued→started→[relayed progress]→ended (the terminal `ended` carries a result reference/link). Relay rule = the target's nature: an SSE/progress target relays its progress into the outbox; a solid REST target emits only started+ended. The sibling `WaitingRoom` (pull/admission-control) is a separate pattern in the same ADR.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `streamBasics` | [`JobStreamBasics`](./JobStreamBasics.md) | yes |  |  |  | The job stream's scalar identity + axes (JobStreamBasics): name/codeName/description, the Kafka job (work) topic, the optional partition key for worker consumer-group parallelism, and the enqueue input schema (the fields the enqueue edge accepts, mapped onto the target API input). Grouped into a section because a chapter is a container of sections, not loose scalar columns (the ComputeJob.jobBasics idiom). |
| `targetApi` | [`JobStreamTargetBinding`](./JobStreamTargetBinding.md) | yes |  |  |  | Binds the processing BusinessApi this stream drives (JobStreamTargetBinding): the target's `api` name (a businessLogic[] BusinessApi in THIS service) + the `action`, the input/result field mappings, and `keepPublicRoute`. The binding implies: emit a kafka WORKER controller on the job topic AND do NOT emit the target's public REST route (internal by default). REQUIRED — a JobStream with no target has nothing to run. |
| `observation` | [`JobStreamObservation`](./JobStreamObservation.md) | no |  |  |  | The reconnectable SSE + durable-outbox observation config (JobStreamObservation): the SSE channel/event name, retention of the per-job outbox (so a reconnect replays everything-since-cursor by jobId), and `relayTargetApiProgress` (relay the target's own SSE/progress events into the outbox when the target emits them; otherwise only started+ended are observed). Null = sensible defaults (reconnectable outbox on, relay off). |
| `jobState` | [`JobStreamState`](./JobStreamState.md) | no |  |  |  | The durable job record (JobStreamState): the status lifecycle (queued→started→[progress]→ended), the store (DB by default), and the field on the `ended` event that carries the result reference/link the frontend navigates to. Null = a DB-backed job record with the default lifecycle. |
| `access` | [`JobStreamAccess`](./JobStreamAccess.md) | no |  |  |  | Who may enqueue a job, and who may observe or snapshot one (JobStreamAccess). The enqueue edge stands in for the target BusinessApi's public route (which binding as a JobStream target suppresses), so by default it INHERITS that api's own `authOptions`; observation and snapshot are bound to the principal + tenant that created the job. Null = that fail-closed default, with no stream-wide privileged observer. |

## Constraints

Property rules:

- `streamBasics`, `targetApi` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `JOBSTREAM_ENQUEUE_ACCESS_CONTRADICTS_CALLER_KIND` | error | JobStream "…" declares access.enqueueAccess "…", but its target BusinessApi "…" declares authOptions.requiredCallerKind:"…" - no human caller may reach it. |
| `JOBSTREAM_ENQUEUE_ACCESS_UNKNOWN` | error | JobStream "…" access.enqueueAccess "…" is not a supported mode (…). |
| `JOBSTREAM_ENQUEUE_ACCESS_WEAKENS_TARGET` | error | JobStream "…" declares access.enqueueAccess "public", but its target BusinessApi "…" declares …. |
| `JOBSTREAM_PARTITION_KEY_UNKNOWN` | error | JobStream "…" partitionKey "…" is not a declared inputSchema field. |
| `JOBSTREAM_REQUIRES_SQL` | error | JobStream requires PostgreSQL on …: its durable job and event stores use the service SQL connection. |
| `JOBSTREAM_TARGET_API_MISSING` | error | JobStream "…" targetApi must reference a BusinessApi by name (api). |
| `JOBSTREAM_TARGET_API_UNKNOWN` | error | JobStream "…" targetApi.api "…" does not match any businessLogic[].basics.apiOptions.name in this service. |
