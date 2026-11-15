# ContentChildSettings

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentChildSettings in Part 2](../spec/ContentChildSettings.md)

The owned-children capability of a content model. Synthesizes a {name}Item DataObject whose rows belong to one content record via 'contentId' (FAQ → FAQ items, release note → release entries, menu → menu items, landing page → sections). Items carry their own declared fields and optional body, are manually ordered when mode is 'ordered', and may nest into trees when allowNesting is true (a 'parentItemId' property is synthesized). Items inherit the parent record's publish state — they have no status machine of their own and are delivered embedded in the parent's delivery payload.

## Contained in

- [ContentModel](./ContentModel.md) as `childSettings`

Blueprint paths:

- `services.contentModels.childSettings`

## Contains

- `fields`: [ContentField](./ContentField.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
