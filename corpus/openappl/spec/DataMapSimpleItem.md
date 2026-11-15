# DataMapSimpleItem

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [DataMapSimpleItem in Part 1](../ontology/DataMapSimpleItem.md)

**Name:** an instance is named by `name`.

Represents a single key-value pair used in most context. The value is constant.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The key name for the data item (e.g., a header name or parameter name). |
| `value` | `String` | yes |  |  |  | The value of the data item, should be deifned as string even it is a number. |
| `secret` | `Boolean` | no | `null` |  |  | Classifies this entry's value as a deploy secret. A secret is masked in the committed env files (a blank $SECRET_ placeholder) and delivered as a CI/CD variable at deploy time. Leave it unset unless you mean to override the default. On a provider configuration entry, true forces a secret, and false or unset lets the provider catalog and the keyword classifier decide: a key named like a credential stays a secret, the flag cannot publish it. On a customVariables entry (project or service), unset means a name with a secret-shaped segment (TOKEN, SECRET, KEY, APIKEY, PASSWORD, PASSWD, PASS, PASSPHRASE, PRIVATE, CREDENTIAL, or a plural of one, split on _ - . and camelCase) is a secret and any other name is plain; true forces a secret; an explicit false keeps the value plain in every committed env file and, for a secret-shaped name, raises the validation warning CUSTOM_VARIABLE_SECRET_SHAPED_PLAIN. |

## Constraints

Property rules:

- `name`, `value` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
