# ContentField

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentField in Part 2](../spec/ContentField.md)

One structured property of a content model (or of its child items). Fields are declared in content-authoring vocabulary (shortText, richText, media, reference, select…) and mapped to storage DataProperty types when the {name}Content DataObject is synthesized. System properties (id, slug, status, body, seo, locale, publishedAt, …) are synthesized from the model's capabilities and must NOT be declared as fields.

## Contained in

- [ContentChildSettings](./ContentChildSettings.md) as `fields` (a list)
- [ContentModel](./ContentModel.md) as `fields` (a list)

Blueprint paths:

- `services.contentModels.fields`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
