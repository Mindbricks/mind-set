# IndexingChunking

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [IndexingChunking in Part 1](../ontology/IndexingChunking.md)

Chunking configuration for an IndexingSpec — how source documents are split into index units.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `strategy` | `String` | no |  |  |  | Chunking strategy (e.g. `fixed`, `sentence`, `recursive`, `semantic`). Kept as String in v1. |
| `size` | `Integer` | no |  |  |  | Target chunk size (tokens/characters per chunk). |
| `overlap` | `Integer` | no |  |  |  | Overlap between adjacent chunks (tokens/characters). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
