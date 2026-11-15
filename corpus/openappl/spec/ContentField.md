# ContentField

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentField in Part 1](../ontology/ContentField.md)

**Name:** an instance is named by `name`.

One structured property of a content model (or of its child items). Fields are declared in content-authoring vocabulary (shortText, richText, media, reference, select…) and mapped to storage DataProperty types when the {name}Content DataObject is synthesized. System properties (id, slug, status, body, seo, locale, publishedAt, …) are synthesized from the model's capabilities and must NOT be declared as fields.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The field name as it appears in the content record and the delivery API. Must be a valid code name and must not collide with the synthesized system properties (slug, status, body, seo, locale, localeGroupId, publishedAt, publishAt, unpublishAt, authorUserId, currentVersion, order, contentId, parentItemId). Examples: 'title', 'excerpt', 'price', 'authorName'. |
| `type` | `ContentFieldType` | no | `"shortText"` | 17 values, see [ContentFieldType](#contentfieldtype) |  | The content field type, mapped to a storage type at synthesis: shortText→String, longText→Text, richText→Text (HTML, sanitized on every write and on public delivery with the fixed ContentBodySettings.format richText allowlist, which keeps img data-size / data-align / loading and figure / figcaption), markdown→Text, integer→Integer, decimal→Double, boolean→Boolean, date→Date, dateTime→DateTime, select→Enum (selectOptions), multiSelect→String array (selectOptions), media→Object asset descriptor in the model's media bucket, reference→ID of another content model's record (referenceContentModel), json→Object, url/email/color→String. |
| `required` | `Boolean` | no | `false` |  |  | When true, the field must be present for the record to be SAVED (draft included). Prefer requiredToPublish for editorial completeness rules. Default: false. |
| `requiredToPublish` | `Boolean` | no | `false` |  |  | When true, the field may be empty on a draft but must be filled before the record can be PUBLISHED (checked by the publish transition). The editorial middle ground between free drafting and delivery completeness. Default: false. |
| `isList` | `Boolean` | no | `false` |  |  | When true, the field holds an ordered list of its type (a gallery of media, a list of tags, multiple references). Default: false. |
| `localized` | `Boolean` | no | `false` |  |  | When true AND the model's localizationSettings is enabled, this field differs per locale variant; unlocalized fields are mirrored from the default-locale record. Default: false. |
| `unique` | `Boolean` | no | `false` |  |  | When true, the field value must be unique across the model's records (per locale when localized). Default: false. |
| `filterable` | `Boolean` | no | `false` |  |  | When true, the field is exposed as a filter parameter on the delivery list/search routes and indexed in the database. Default: false. |
| `searchable` | `Boolean` | no | `true` |  |  | When true (default), the field participates in the delivery full-text search (text-typed fields only; non-text types ignore this flag). |
| `defaultValue` | `Any` | no |  |  |  | Optional default value applied when the field is absent at create time. |
| `selectOptions` | `String`[] | no |  |  |  | The allowed values for select / multiSelect fields. Required (non-empty) for those types, ignored by every other type. |
| `referenceContentModel` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | For reference fields: the name of a content model in the SAME service. Design-time validation checks that the named model exists; the value is stored as a plain indexed ID. Node.js currently generates no target-record lookup, referential-integrity/deletion policy or automatic expansion from this setting. Those runtime contracts require a maintainer ruling. |
| `description` | `Text` | no |  |  |  | Human-readable description of the field, surfaced in the editorial UI and the generated docs. |

## Allowed values

### ContentFieldType

`shortText`, `longText`, `richText`, `markdown`, `integer`, `decimal`, `boolean`, `date`, `dateTime`, `select`, `multiSelect`, `media`, `reference`, `json`, `url`, `email`, `color`

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `type` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name`, `referenceContentModel` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
