# ContentSearchSettings

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentSearchSettings in Part 1](../ontology/ContentSearchSettings.md)

The search capability of a content model. The synthesized DataObjects are Elasticsearch-indexed like any DataObject; this section tunes the delivery search route (GET /content/{name}/search): full-text search over the searchable fields + body, and optional semantic search — searchable text is additionally embedded via a NAMED projectSettings.aiProvidersSettings provider so queries match by meaning ('refund my order' finds the returns policy).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `fulltextSearch` | `Boolean` | no | `true` |  |  | When true (default), the delivery search route serves keyword full-text search over the model's searchable fields and body. |
| `semanticSearch` | `Boolean` | no | `false` |  |  | When true, searchable content is ALSO embedded (embeddingProviderName) and the search route upgrades to hybrid keyword + semantic ranking. Default: false. |
| `embeddingProviderName` | `String` | no |  |  |  | Name of the AI provider (a projectSettings.aiProvidersSettings.aiProviders[].name) used to embed content for semantic search. Required when semanticSearch is true. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
