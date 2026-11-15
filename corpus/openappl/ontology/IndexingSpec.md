# IndexingSpec

**Level:** `subsection` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [IndexingSpec in Part 2](../spec/IndexingSpec.md)

Type-specific spec for `indexing` ComputeJobs — the AI-native-app workhorse: chunk → embed → write index. libraryWrapped + generated pipeline: the intended compiler contract includes the loader, chunking, metadata, embed adapter, vector write, dedup, retry, and reindex. Presets: EmbeddingPipeline (chunk+embed+write), DocumentChunkingJob (chunk-only), SearchRebuildJob (`writeMode:rebuild`). This declaration describes the intended compute contract, not a guarantee that every field is executed. ComputeJob hosting is restricted to Rust/Python; Node.js does not host these jobs. Implementation of individual unresolved fields on supported hosts must be assessed separately.

## Contained in

- [ComputeJobSpec](./ComputeJobSpec.md) as `indexing`

## Contains

- `chunking`: [IndexingChunking](./IndexingChunking.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
