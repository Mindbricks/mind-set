# ContentMediaSettings

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentMediaSettings in Part 1](../ontology/ContentMediaSettings.md)

Media fields hold bucket asset descriptors; upload through the existing service bucket routes, then attach the descriptor using the editorial update API. The model binds to a declared remoteBuckets or nativeBuckets entry in the same service. Descriptors contain storageKey, url, mimeType, size and alt; no second storage system is created.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `bucketName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the service bucket (a remoteBuckets[] or nativeBuckets[] entry in the SAME service) media assets are stored in. |
| `allowedKinds` | `ContentMediaKind`[] | no |  | `image`, `video`, `audio`, `document` |  | The media kinds editors may attach. Absent/empty = any kind. |
| `maxFileSizeMb` | `Integer` | no |  |  |  | Maximum size of one media asset in megabytes. Null/absent = the bucket's own limit. |

## Constraints

Property rules:

- `bucketName` must be present. (`REQUIRED_FIELD_MISSING`)
- `allowedKinds` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `bucketName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
