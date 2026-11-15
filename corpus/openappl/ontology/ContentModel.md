# ContentModel

**Level:** `chapter` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentModel in Part 2](../spec/ContentModel.md)

A declarative content model generates storage objects, editorial APIs, publishing transitions, and headless delivery. Content and optional child/version objects retain normal migrations, indexing and database-change events. On nodejs the generated editorial Business APIs support content create/get/list/update/delete, item create/update/delete/list, and version list/get; dedicated reorder and restoreVersion operations use the content pipeline. No designer-authored CRUD is required. Existing object/operation APIs are retained; contentBasics.editorialApis: none disables generated editorial APIs. Configure permissionSettings before exposing an editorial UI. Other content-runtime languages are nodejs, python, java, dotnet and rust; new editorial runtime operations require their port records.

## Contained in

- [Service](./Service.md) as `contentModels` (a list)

Blueprint paths:

- `services.contentModels`

## Contains

- `contentBasics`: [ContentModelBasics](./ContentModelBasics.md)
- `fields`: [ContentField](./ContentField.md), a list
- `bodySettings`: [ContentBodySettings](./ContentBodySettings.md)
- `childSettings`: [ContentChildSettings](./ContentChildSettings.md)
- `mediaSettings`: [ContentMediaSettings](./ContentMediaSettings.md)
- `routingSettings`: [ContentRoutingSettings](./ContentRoutingSettings.md)
- `localizationSettings`: [ContentLocalizationSettings](./ContentLocalizationSettings.md)
- `publishingSettings`: [ContentPublishingSettings](./ContentPublishingSettings.md)
- `versioningSettings`: [ContentVersioningSettings](./ContentVersioningSettings.md)
- `permissionSettings`: [ContentPermissionSettings](./ContentPermissionSettings.md)
- `searchSettings`: [ContentSearchSettings](./ContentSearchSettings.md)
- `eventSettings`: [ContentEventSettings](./ContentEventSettings.md)
- `contentModeration`: [ObjectModeration](./ObjectModeration.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
