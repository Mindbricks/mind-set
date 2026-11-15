# ContentMediaSettings

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentMediaSettings in Part 2](../spec/ContentMediaSettings.md)

Media fields hold bucket asset descriptors; upload through the existing service bucket routes, then attach the descriptor using the editorial update API. The model binds to a declared remoteBuckets or nativeBuckets entry in the same service. Descriptors contain storageKey, url, mimeType, size and alt; no second storage system is created.

## Contained in

- [ContentModel](./ContentModel.md) as `mediaSettings`

Blueprint paths:

- `services.contentModels.mediaSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
