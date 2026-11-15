# ContentRichTextAllowRule

**Level:** `subsection` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentRichTextAllowRule in Part 1](../ontology/ContentRichTextAllowRule.md)

**Name:** an instance is named by `name`.

One rule of bodySettings.richTextAllowlist: a tag the richText body may keep, with the extra attributes and the exact class names it may carry. A value outside an attribute's pattern or length cap removes that attribute and keeps the element; a class token not in classes is removed.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The tag name, lowercase (e.g. 'div', 'details', 'p'). One rule per tag. |
| `attributes` | [`ContentRichTextAllowAttribute`](./ContentRichTextAllowAttribute.md)[] | no |  |  |  | The attributes this tag may keep in addition to the fixed set, each with an optional value pattern and length cap. |
| `classes` | `String`[] | no |  |  |  | The exact class names this tag may keep (e.g. ['note', 'warning']); every other class token is removed. Each name matches [A-Za-z][A-Za-z0-9_-], at most 64 characters. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `attributes` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
