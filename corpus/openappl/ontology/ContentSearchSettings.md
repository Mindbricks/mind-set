# ContentSearchSettings

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentSearchSettings in Part 2](../spec/ContentSearchSettings.md)

The search capability of a content model. The synthesized DataObjects are Elasticsearch-indexed like any DataObject; this section tunes the delivery search route (GET /content/{name}/search): full-text search over the searchable fields + body, and optional semantic search — searchable text is additionally embedded via a NAMED projectSettings.aiProvidersSettings provider so queries match by meaning ('refund my order' finds the returns policy).

## Contained in

- [ContentModel](./ContentModel.md) as `searchSettings`

Blueprint paths:

- `services.contentModels.searchSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
