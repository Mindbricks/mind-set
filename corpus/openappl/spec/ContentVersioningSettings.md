# ContentVersioningSettings

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentVersioningSettings in Part 1](../ontology/ContentVersioningSettings.md)

The revision-history capability of a content model. When enabled, a {name}ContentVersion DataObject is synthesized and an immutable snapshot row (full field + body payload, capture reason, author) is written on every publish transition — or on every update when captureOn is 'everyUpdate' — enabling audit, diff, and restore of earlier revisions.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Master toggle for versioning. Default: false. |
| `captureOn` | `ContentVersionCapture` | no | `"publish"` | `publish`, `everyUpdate` |  | 'publish' (default) = snapshot on every publish transition (the editorially meaningful history). 'everyUpdate' = snapshot on every save (full audit trail, more rows). |
| `maxVersions` | `Integer` | no |  |  |  | Keep at most this many snapshots per record (oldest pruned). Null/absent = keep all. |
| `versionDataObjectName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Override name for the synthesized version DataObject. Defaults to '{name}ContentVersion'. Must be a valid code name. |

## Constraints

Property rules:

- `captureOn` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `versionDataObjectName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
