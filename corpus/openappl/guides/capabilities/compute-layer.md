---
title: Compute and calculation layer
---

# Compute and calculation layer

Every service serves the web: data objects, a data layer, business APIs, events and
realtime. A `rust` or `python` service does all of that **and** can *compute*. Picking one
of those two languages unlocks a second capability on the same full service: *"some of
the work here is CPU-heavy"*. Examples are ETL over millions of rows, ONNX inference,
media transcoding, embedding pipelines, Monte-Carlo simulation, portfolio risk and bulk
cryptography. The **compute layer** is the vocabulary for that intent. It turns a
*declared* heavy computation into a generated, asynchronous job pipeline (submit, queue,
worker, result, artifact, completion event, cancel, retry) running on a curated recipe or
on your own code.

This page is the conceptual guide: how to think about the layer, and when to reach for
what. The exact field and enum names live on the pattern pages in the specification,
linked throughout. For what a compiler emits for a compute service, see
[the compiler specification](../../compiler/index.md).

> **Compute is opt-in and zero-footprint.** A service that declares no `computeJobs` and
> no `Calculation` library functions gets no worker, no dependency and no system object.
> Existing services are untouched. Compute is a *capability* any Rust or Python service
> can host, not a separate service kind.

---

## The central idea: compute is a Rust/Python capability, not a service kind

Only two languages may *host* compute work, and that restriction bounds *where the math
runs*, nothing else. A compute host is a **full microservice**: it owns data objects, a
data layer, business APIs, events and realtime exactly like any other service, and on top
of that it carries the compute capability.

| Language | Role in compute |
|----------|-----------------|
| **Rust**, **Python** | **Host.** A full service that may *also* declare `computeJobs` and run the worker. |
| Node, Java, Go, C#, ... | **Submit.** Offload a job to a compute host over `InterService` (machine-to-machine) and react to the completion event. These languages do not run the math. |

Declaring a `ComputeJob` (or a `Calculation`) on a service whose language (see
[the compiler specification](../../compiler/index.md)) is not `rust` or `python` is an
error at compile time. That is the *only* limit. A real compute host (say a
recommendation engine written in Rust) still serves its own data objects and business
APIs to the world. Its `submitComputeJob` and `cancelComputeJob` APIs are
`M2MAllowed`, so **any** other service that meets heavy work calls
`InterService.call('<compute-svc>', 'submitComputeJob', ...)` and subscribes to the
`sys_computeEvent` completion, the same way it calls any other service. There is no "front
the web here, compute there" division: a compute host is a normal, complete service that
happens to also compute.

---

## Two tiers, two altitudes

Computation is modelled at two altitudes. Choosing between them is the first decision you
make.

| Tier | Pattern | Shape | Reach for it when |
|------|---------|-------|-------------------|
| **Primitive** | [`Calculation`](../../spec/Calculation.md) | A `ServiceLibrary` function called inline, as in `LIB.fft(this.signal)`, answered *within the request*. | The math is small, bounded, and belongs in a request/response. |
| **Workload** | [`ComputeJob`](../../spec/ComputeJob.md) | A typed, declared workload run through the **async lifecycle**. | Anything heavy. The default and recommended shape for non-trivial work. |

The mental model: a `Calculation` is a *function call* that returns now; a `ComputeJob`
is a *unit of work* you submit and watch. A heavy job that tries to answer `inline`
(synchronously, in the request) is the anti-pattern the whole layer exists to prevent. A
`POST /calculate-risk` that blocks for three minutes ties up a request worker, has no
progress, cannot be cancelled, dies on deploy and cannot be retried. The compiler flags a
heavy job left inline.

---

## The job lifecycle

A declared `ComputeJob` (in the default `job` mode) produces the **full async lifecycle**,
not a synchronous endpoint:

```
 submit --> queue --> worker --> result / artifact --> completion event
   |                    |                                      ^
   |                    +-- cancel (cooperative) --------------+
   +-- retry (attempts, backoff, dead-letter) -----------------+
```

1. **Submit.** A generated business API `submitComputeJob` enqueues the job and returns a
   `jobId`. It **never blocks** on the result and is **`M2MAllowed`**, so any service
   (including a non-host Node or Java service) can offload work.
2. **Queue.** The default backing is **database-polled**: the worker claims
   `sys_computeJob` rows whose status is `queued`, without two workers ever taking the
   same row. The queue is a seam, so a message-broker consumer can replace it later
   without touching dispatch.
3. **Worker.** A `compute-worker` controller type (a sibling to `cron` and `kafka`)
   drains the queue and dispatches each job by `type` to its per-job body on the
   **bounded compute pool**. It boots without editing the HTTP entry point of the service.
4. **Result and artifact.** A `summary` / `metrics` result, plus `sys_computeArtifact`
   rows for large outputs (see [`ComputeJobResult`](../../spec/ComputeJobResult.md)).
   **Artifacts are always bucket references, never inline blobs.**
5. **Completion event.** A normalized row on the `sys_computeEvent` outbox (the idempotent
   payment-event shape), so callers react through Kafka or a webhook instead of polling.
6. **Cancel.** `cancelComputeJob` (also `M2MAllowed`) flips the status to `cancelled`. The
   worker observes it **cooperatively**, through a cancel flag the recipe polls, and ends
   the job with a `Cancelled` terminal outcome.
7. **Retry.** A [`ComputeRetryPolicy`](../../spec/ComputeRetryPolicy.md) (`maxAttempts`,
   `backoff: fixed | linear | exponential`, `deadLetter`) is applied per job by the
   worker.

`getComputeJob` and `listComputeJobs` expose status and progress.

---

## The library-vs-generate axis: `implementationMode`

The deepest design decision in any compute work is *which parts do we write and which
parts do we trust to a vetted library?* The language makes that decision an **explicit
declared axis** instead of an implicit accident of how someone happened to code it. Every
job carries an [`implementationMode`](../../spec/ComputeJobBasics.md):

| Mode | The hard part is... | The compiler generates... | Example specs |
|------|---------------------|----------------------------|---------------|
| `libraryWrapped` | a mature library | loading, batching, marshaling, lifecycle | ai-inference, crypto-batch |
| `toolOrchestrated` | an external **binary** (FFmpeg, Tesseract) | intake, command construction, artifact capture, dependency declaration | media-processing |
| `generatedNative` | the *structure itself* (a Monte-Carlo loop, a constraint problem) | native Rust/Python from the pattern, using libraries only for math primitives | optimization, simulation |
| `hybrid` | library-backed heavy lifting wrapped in generated orchestration | the orchestration and structure around the library | batch-transform, simulation, risk-calculation |

> **The governing rule.** Keep it in mind whenever you wonder whether a job should
> "generate" something:
>
> *Use vetted libraries for universal hard problems. Generate code for business-specific
> structure, orchestration, mapping, validation, lifecycle and auditability. **Never**
> generate cryptographic primitives, codecs or numerical routines that a vetted crate or
> package already provides.*

This is why `crypto-batch` is `libraryWrapped` **only**. The compiler generates the file
batching, key handling and audit log, but the SHA, sign and encrypt primitives always come
from a vetted library and are never hand-rolled.

---

## Choosing a workload: the typed specs

[`ComputeJobBasics.type`](../../spec/ComputeJobBasics.md) selects a **curated archetype**:
a discriminated spec sub-object on [`ComputeJobSpec`](../../spec/ComputeJobSpec.md)
carrying that workload's unique fields, plus sensible defaults (library set,
implementation mode, resource profile, result and artifact shape). Exactly one sub-object
is populated, the one matching `type`. The eight first-class specs:

| `type` | Spec | Primary lang | Mode | Use it for |
|--------|------|--------------|------|------------|
| `batch-transform` | [`BatchTransformSpec`](../../spec/BatchTransformSpec.md) | Python / Rust | `hybrid` | ETL, imports and exports, report precompute, aggregation over millions of rows. |
| `ai-inference` | [`AiInferenceSpec`](../../spec/AiInferenceSpec.md) | Python | `libraryWrapped` | Classification, embeddings, scoring, transcription (ONNX, torch, `ort`) with a model **you host**. For classification with **no trained model**, see [the decision layer](decision-layer.md): a remote zero-shot provider answers typed questions in 250-400 ms with no model to train or serve. |
| `media-processing` | [`MediaProcessingSpec`](../../spec/MediaProcessingSpec.md) | Rust / Python | `toolOrchestrated` | Thumbnails, resize, transcode, PDF render, OCR (FFmpeg, Tesseract, `image`, Pillow). |
| `indexing` | [`IndexingSpec`](../../spec/IndexingSpec.md) | Python | `libraryWrapped` + pipeline | Chunk, embed, write-index: the workhorse of AI-native applications. |
| `optimization` | [`OptimizationSpec`](../../spec/OptimizationSpec.md) | Python | `generatedNative` + solver | Routing, scheduling, allocation, constraint solving. |
| `simulation` | [`SimulationSpec`](../../spec/SimulationSpec.md) | Rust / Python | `hybrid` | Monte-Carlo, discrete-event, agent, time-step. |
| `risk-calculation` | [`RiskCalculationSpec`](../../spec/RiskCalculationSpec.md) | Rust / Python | `hybrid` | Portfolio risk, pricing, credit scoring. Produces a **sealed audit trail**. |
| `crypto-batch` | [`CryptoBatchSpec`](../../spec/CryptoBatchSpec.md) | **Rust** | `libraryWrapped` only | Bulk hashing, signature verification, integrity scanning. Never generated primitives. |

### Presets vs specs vs custom

Three things sit at three different levels, and the level decides how much each costs to
build:

- **Specs** (the eight above) are *real patterns* with their own schema and type-specific
  generation. An `AiInferenceSpec` is shaped nothing like an `OptimizationSpec`; this is
  where the per-type value lives.
- **Presets** are **named field-bundles over a spec**, with no schema of their own.
  `ThumbnailJob` is `MediaProcessingSpec { op: thumbnail }`; `EmbeddingPipeline` is an
  `IndexingSpec` configuration; `DataImportPipeline` is `BatchTransformSpec
  { direction: import }`. A preset is just a default an author picks and overrides.
- **`custom`** ([`CustomSpec`](../../spec/CustomSpec.md), `type: custom`) is the
  bring-your-own-code escape hatch, described below.

A small blueprint with a `batch-transform` job. The JSON is language-agnostic: a Rust host
may turn it into `polars` plus `rayon`, a Python host into `polars` or `pandas`.

```jsonc
// service.computeJobs[]
[
  {
    "jobBasics": {
      "name": "rebuildTenantAnalytics",
      "type": "batch-transform",            // selects spec.batchTransform
      "executionMode": "job",               // job (async, default) | serving (warm)
      "implementationMode": "hybrid",       // the library-vs-generate axis
      "parallel": "data-parallel"           // intra-job parallelism (single | data-parallel)
    },
    "spec": {                               // payload keyed by `type`
      "batchTransform": {
        "direction": "internal",
        "aggregation": { "groupBy": ["tenantId", "day"], "agg": ["count", "sum:amount"] },
        "errorRowHandling": "collect"
      }
    },
    "input":  { "type": "bucketRef", "schema": "tenantEventsCsv" },
    "result": { "summarySchema": "analyticsSummary", "artifact": "parquet" },
    "resourceProfile": {
      "cpuCores": 4, "memoryLimit": "8Gi", "timeout": "30m",
      "concurrency": 2, "preferredLanguage": "rust", "gpuRequired": false
    },
    "retryPolicy": { "maxAttempts": 3, "backoff": "exponential", "deadLetter": true }
  }
]
```

`input.schema` and `result.summarySchema` name data objects of the service
([`ComputeJobInput`](../../spec/ComputeJobInput.md),
[`ComputeJobResult`](../../spec/ComputeJobResult.md)).

---

## What each spec produces

The lifecycle scaffolding is uniform across all specs, and every spec comes with a
**production recipe body**: real work against the spec and input, not a placeholder.

| Spec | Recipe body |
|------|-------------|
| `batch-transform` | Reads the spec and input, does real `polars` / `pandas` work. |
| `ai-inference` | Resolves the model reference, runs real ONNX (`ort`) inference. |
| `media-processing` | Real `image`, FFmpeg and Tesseract tool orchestration. |
| `indexing` | A real chunk, embed and write pipeline. |
| `crypto-batch` | Real `sha2`, `blake3`, sign and encrypt (Rust only). |
| `simulation` | A real Monte-Carlo or time-step body through the parallel lifecycle. |
| `optimization` | A real solver body (OR-Tools, `scipy`, `argmin`). |
| `risk-calculation` | A real risk body plus the sealed audit-trail plumbing. |

A generated recipe is a starting point you tune, not a frozen black box. For
business-specific math you refine the `generatedNative` body or drop to a `custom` spec,
but every spec runs real work end to end out of the gate.

---

## `executionMode`: `job` (async) vs `serving` (warm)

A `ComputeJob` carries an `executionMode`:

- **`job`** (default): the async lifecycle above. Fire-and-forget, queued, observable,
  cancellable, retryable, artifact-producing. Right for batch and long work.
- **`serving`**: a warm controller that loads the spec's model, solver or state **once**
  at startup and exposes a synchronous, bounded-concurrency machine-to-machine API. No
  queue, no artifact, no retry (the caller owns retries). Right when per-call reuse
  dominates (a loaded model, a compiled solver, a priced book). In the current schema this
  mode is declared but not yet generated: only `job` mode produces code.

---

## Resource discipline: profiles and settings

Compute never spawns unbounded threads or processes. Two declarations bound it.

Per job (or the project default),
[`ComputeResourceProfile`](../../spec/ComputeResourceProfile.md):

```json
{ "cpuCores": 4, "memoryLimit": "8Gi", "timeout": "30m", "concurrency": 2, "preferredLanguage": "rust", "gpuRequired": false }
```

It drives three things: the **bounded worker-pool size** (cores and concurrency), the
**resource requests of the deployment**, and **rejection of impossible jobs**.

Project-wide, [`computeSettings`](../../spec/ComputeSettings.md) on `projectSettings`:

```json
{ "maxConcurrentJobs": 8, "queueDepth": 1000, "defaultResourceProfile": { "cpuCores": 2, "memoryLimit": "4Gi", "timeout": "15m" }, "pythonFreeThreaded": false, "gpuEnabled": false }
```

`maxConcurrentJobs` bounds inter-job concurrency; `queueDepth` sizes the queue before
backpressure; `gpuEnabled` is a **scheduling flag only** for now (GPU pooling is
deferred). `pythonFreeThreaded` is the GIL opt-in described below.

---

## The honest Rust-vs-Python parallelism note

The queue gives **inter-job** concurrency (N jobs across the pool). **Intra-job**
parallelism, which divides one job across cores, is configured per job
(`parallel: data-parallel`) and realized inside the worker. The two hosts are **not
symmetric**, and the language surfaces the asymmetry rather than hiding it.

**Rust: true parallelism, no GIL.** `rayon` for data-parallel map and reduce
(work-stealing, shared-memory, sized by the resource profile); a dedicated blocking pool
keeps heavy jobs off the request runtime. This is why Rust is the recommendation for
throughput-critical and crypto work.

**Python: GIL-bounded, three honest strategies**, chosen per job and **documented in the
generated service documentation** (never silent):

| Strategy | What it is | Chosen for |
|----------|-----------|------------|
| `THREAD` | Native-library GIL release: NumPy, polars and torch drop the GIL during compute, so a thread pool parallelizes inside the native library. | the default for `libraryWrapped` jobs |
| `PROCESS` | A process pool for pure-Python CPU loops that the GIL serializes. | `generatedNative` CPU loops, and **mandatory** for `custom` jobs (crash isolation) |
| `FREE_THREADED` | True multi-core threads on a no-GIL interpreter build (3.13t / 3.14t). | opt-in through `computeSettings.pythonFreeThreaded`; it **falls back to `THREAD`, documented and not silent**, when the running interpreter still holds the GIL |

The GIL trade-off is the kind of thing that bites silently in hand-written code; here it
is a declared, documented strategy.

---

## Custom compute jobs: bring your own calculation

The curated specs cover *known* workloads; [`CustomSpec`](../../spec/CustomSpec.md)
(`type: custom`) is the first-class escape hatch for your own Rust or Python routine. It
carries:

- `language`: `rust | python`, and it must match the host (the host guard applies).
- `computeSourceType`: `inline` (code in `body`), `url`, `git` or `bucket`. Non-inline
  sources are fetched at build time as **native source, not FFI**: no C ABI, no shim, no
  isolation overhead.
- `entrypoint` (the function the worker calls), `dependencies[]` (extra crates or pip
  packages), and `params` / `returns` (the marshaled boundary, with the same flat-data
  discipline as the rest of the layer).

The compiler **generates the lifecycle scaffolding around an opaque user function**:
submit, queue, worker, `entrypoint(inputs)` on the bounded pool, result and artifact,
event, cancel and retry. "Generated" here means the *wrapper*; you own the math.

### The failure domain: read this before shipping custom code

This is the one place where author code needs guarding, and it is **crash isolation, not a
sandbox**:

- **Rust:** the entrypoint runs under panic isolation on the blocking task, so a panic
  fails the **job**, not the **service**. Compile errors in supplied source surface at
  build time.
- **Python:** `custom` jobs **always** run on the `PROCESS` pool, so a crash or runaway
  kills a worker *process*, not the service; the resource-profile `timeout` bounds runaway
  loops.
- **Neither is a true sandbox:** there is no syscall jailing. Custom code runs with
  **service privileges**. Untrusted or third-party code must be gated by the project. That
  is the honest limit.

---

## How to decide: a short flowchart in prose

1. **Is the work cheap and request-scoped?** Use a [`Calculation`](../../spec/Calculation.md)
   library function, called inline. Stop.
2. **Is the host Rust or Python?** If not, the work must be *submitted* over
   machine-to-machine calls to a compute host; design the other side as a submitter and
   event reactor.
3. **Does a typed spec match the workload?** Pick it, and a preset if one fits. Prefer
   `libraryWrapped` or `toolOrchestrated` over `generatedNative`: trust the vetted
   library.
4. **Pick the spec that matches** (batch-transform, ai-inference, media-processing,
   indexing, crypto-batch, simulation, optimization, risk-calculation). Each ships a
   production recipe body you can tune.
5. **Nothing fits?** `CustomSpec` with an `inline`, `url`, `git` or `bucket` source. You
   write the math, the compiler owns the lifecycle and the crash domain.
6. **Need a warm, low-latency endpoint, not a job?** That is `serving` mode: a warm
   singleton holding hot state behind a synchronous machine-to-machine API.

---

## See also

- [Graph intelligence: graph + compute](graph-and-compute.md): running compute jobs over
  graph projections (the `graphIO` hybrid).
- [Native kernels](native-kernels.md): the *orthogonal* foreign-function facility for
  bespoke C/C++ with no Rust binding; compute consumes native crates **directly** and does
  not build on it.
- [The compiler specification](../../compiler/index.md): who hosts and who submits, and
  what is generated for a compute service.
- Patterns: [`ComputeJob`](../../spec/ComputeJob.md),
  [`ComputeJobBasics`](../../spec/ComputeJobBasics.md),
  [`ComputeJobSpec`](../../spec/ComputeJobSpec.md),
  [`ComputeResourceProfile`](../../spec/ComputeResourceProfile.md),
  [`ComputeRetryPolicy`](../../spec/ComputeRetryPolicy.md),
  [`ComputeSettings`](../../spec/ComputeSettings.md),
  [`Calculation`](../../spec/Calculation.md).
