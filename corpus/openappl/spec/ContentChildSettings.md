# ContentChildSettings

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentChildSettings in Part 1](../ontology/ContentChildSettings.md)

The owned-children capability of a content model. Synthesizes a {name}Item DataObject whose rows belong to one content record via 'contentId' (FAQ → FAQ items, release note → release entries, menu → menu items, landing page → sections). Items carry their own declared fields and optional body, are manually ordered when mode is 'ordered', and may nest into trees when allowNesting is true (a 'parentItemId' property is synthesized). Items inherit the parent record's publish state — they have no status machine of their own and are delivered embedded in the parent's delivery payload.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mode` | `ContentChildMode` | no | `"ordered"` | `ordered`, `unordered` |  | 'ordered' (default) reserves an Integer order column for manual delivery ordering; use the editorial reorder operation. Quote the column as "order" in handwritten SQL. In service-library list calls, order is the sort-envelope key: put an order-column filter in the query envelope rather than the top level. 'unordered' has no order column and sorts by creation time. |
| `fields` | [`ContentField`](./ContentField.md)[] | no |  |  |  | The child item's own structured fields, declared exactly like the model's fields (same types, same reserved-name rules). |
| `bodyFormat` | `ContentBodyFormat` | no |  | `richText`, `markdown`, `blocks` |  | Optional rich body of each child item (an FAQ item's answer, a landing section's copy). Same formats as bodySettings. Absent = children have structured fields only. |
| `allowNesting` | `Boolean` | no | `false` |  |  | When true, items may nest under other items via the synthesized 'parentItemId' (documentation trees, multi-level menus). Default: false (a flat list). |
| `itemDataObjectName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Override name for the synthesized child DataObject. Defaults to '{name}Item'. Must be a valid code name. |

## Constraints

Property rules:

- `mode`, `bodyFormat` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `itemDataObjectName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `fields` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
