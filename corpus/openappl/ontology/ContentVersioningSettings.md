# ContentVersioningSettings

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentVersioningSettings in Part 2](../spec/ContentVersioningSettings.md)

The revision-history capability of a content model. When enabled, a {name}ContentVersion DataObject is synthesized and an immutable snapshot row (full field + body payload, capture reason, author) is written on every publish transition — or on every update when captureOn is 'everyUpdate' — enabling audit, diff, and restore of earlier revisions.

## Contained in

- [ContentModel](./ContentModel.md) as `versioningSettings`

Blueprint paths:

- `services.contentModels.versioningSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
