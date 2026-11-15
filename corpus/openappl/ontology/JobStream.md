# JobStream

**Level:** `chapter` · **Family:** [JobStream](./families.md#jobstream) (domain `Service`)

**Specification:** [JobStream in Part 2](../spec/JobStream.md)

An async-job-orchestration pattern (docs/ADR-async-job-orchestration-patterns.md). A `JobStream` is a durable, reconnectable, observable async BUSINESS job that GENERALIZES `ComputeJob`: it reuses ComputeJob's durable event-outbox + reconnectable SSE-tail machinery, but the 'work' is a **BusinessApi invocation** (not a native compute kernel). deliveryMode is `push` (a worker drains a Kafka work topic and calls the target API; the target needs no change). From ONE declaration codegen emits: an enqueue edge (produce → job topic + create the job record + return jobId), a Kafka-consumer WORKER controller on the target BusinessApi bound to that topic, a durable per-job event outbox, and a reconnectable SSE observation edge keyed by jobId — AND it SUPPRESSES the target BusinessApi's public REST route (binding-as-JobStream-target ⇒ internal by default; `targetApi.keepPublicRoute` re-exposes it). Clients enter through the enqueue and SSE observation edges. Server-side code in the same service can call `enqueueJobStream(name, input, { session, requestId })` from the generated job-stream-layer barrel; it runs the same enqueue gate against the supplied session and creates the same durable job row and work message as the REST enqueue route. Suppression is REST-ONLY: a target that ALSO declares a gRPC, SSE or kafka controller keeps that transport mounted with its own auth posture, so 'reachable only via the worker' holds when REST is the api's sole transport. Lifecycle: queued→started→[relayed progress]→ended (the terminal `ended` carries a result reference/link). Relay rule = the target's nature: an SSE/progress target relays its progress into the outbox; a solid REST target emits only started+ended. The sibling `WaitingRoom` (pull/admission-control) is a separate pattern in the same ADR.

## Contained in

- [Service](./Service.md) as `jobStreams` (a list)

Blueprint paths:

- `services.jobStreams`

## Contains

- `streamBasics`: [JobStreamBasics](./JobStreamBasics.md)
- `targetApi`: [JobStreamTargetBinding](./JobStreamTargetBinding.md)
- `observation`: [JobStreamObservation](./JobStreamObservation.md)
- `jobState`: [JobStreamState](./JobStreamState.md)
- `access`: [JobStreamAccess](./JobStreamAccess.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
