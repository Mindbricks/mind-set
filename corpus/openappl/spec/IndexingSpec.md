# IndexingSpec

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [IndexingSpec in Part 1](../ontology/IndexingSpec.md)

Type-specific spec for `indexing` ComputeJobs — the AI-native-app workhorse: chunk → embed → write index. libraryWrapped + generated pipeline: the intended compiler contract includes the loader, chunking, metadata, embed adapter, vector write, dedup, retry, and reindex. Presets: EmbeddingPipeline (chunk+embed+write), DocumentChunkingJob (chunk-only), SearchRebuildJob (`writeMode:rebuild`). This declaration describes the intended compute contract, not a guarantee that every field is executed. ComputeJob hosting is restricted to Rust/Python; Node.js does not host these jobs. Implementation of individual unresolved fields on supported hosts must be assessed separately.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `source` | `String` | no |  |  |  | The source of documents to index (a DataObject, bucket, or external corpus — String in v1). |
| `chunking` | [`IndexingChunking`](./IndexingChunking.md) | no |  |  |  | Chunking configuration (strategy/size/overlap) — IndexingChunking. |
| `metadataExtraction` | `String` | no |  |  |  | Optional metadata-extraction rules attached to each chunk (String/MScript in v1). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `embed` | `String` | no |  |  |  | How chunks are embedded — delegates to an `ai-inference` embed task or a provider (String in v1; a delegated-spec reference is a later-wave refinement). |
| `indexTarget` | `String` | no |  |  |  | Where vectors/index entries are written: `elasticsearch\|opensearch\|vector`. Kept as String in v1. |
| `writeMode` | `String` | no |  |  |  | `upsert\|rebuild`. Kept as String in v1. |
| `dedup` | `Boolean` | no |  |  |  | When true, duplicate chunks are de-duplicated before write. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
