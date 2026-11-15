# ContentRoutingSettings

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentRoutingSettings in Part 2](../spec/ContentRoutingSettings.md)

Public delivery routing generates a slug on first publish from slugSource; drafts are addressed by id in editorial APIs. Collection delivery uses /content/{kebab-name}/{slug}; authenticated editorial preview also accepts the record id. Generated editorial writes exclude slug and publish-managed fields. Singleton delivery uses the model base route. basePath is a frontend page-path hint, not the service API prefix; singletons without an explicit basePath are omitted from the public sitemap. Optional seo metadata is attached to the delivery payload.

## Contained in

- [ContentModel](./ContentModel.md) as `routingSettings`

Blueprint paths:

- `services.contentModels.routingSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
