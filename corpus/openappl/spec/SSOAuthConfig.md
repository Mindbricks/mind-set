# SSOAuthConfig

**Level:** `subsection` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [SSOAuthConfig in Part 1](../ontology/SSOAuthConfig.md)

Retained external identity provider settings for the unavailable SSO feature. Configuring these fields does not enable SSO; useSSOForAuthentication=true is refused with SSO_NOT_SUPPORTED. No profile mapping or account linking flow is generated.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `ssoName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | A human-readable name to identify this SSO provider in your project (e.g., 'corporateSSO' or 'okta'). |
| `tokenPeriodInMinutes` | `Integer` | no | `15` |  |  | Retained token period setting in minutes. Existing token period resolution is unchanged; this value does not enable an SSO login flow. |
| `emailPropertyInProfile` | `String` | no | `"email"` |  | format [dotPath](./value-formats.md#dotpath) | Declared SSO profile property for a user's email address. Current nodejs generation performs no SSO profile mapping, local-user lookup/creation or account linking through this field. SSO activation is refused with SSO_NOT_SUPPORTED; verified-email trust and linking behavior remain undecided. |
| `userNamePropertyInProfile` | `String` | no | `"name"` |  | format [dotPath](./value-formats.md#dotpath) | Declared SSO profile property for a user's display name. Current nodejs generation performs no SSO profile mapping or local-user creation/update through this field. SSO activation is refused with SSO_NOT_SUPPORTED; when and how a name would be copied remain undecided. |
| `ssoUserIdPropertyInProfile` | `String` | no | `"sub"` |  | format [dotPath](./value-formats.md#dotpath) | Declared SSO profile property for a provider user identifier. Current nodejs generation does not bind this value to a local identity. SSO activation is refused with SSO_NOT_SUPPORTED; issuer/subject binding and account-linking rules remain undecided. |
| `ssoServerSettings` | [`SSOServerSettings`](./SSOServerSettings.md) | yes |  |  |  | Declared SSO provider endpoints and client credentials. Current nodejs generation emits no SSO provider requests, profile mapping, SSO environment variables or deploy secrets. SSO activation is refused with SSO_NOT_SUPPORTED; provider protocol, request security, credentials and account-linking semantics remain undecided. |

## Constraints

Property rules:

- `ssoName`, `ssoServerSettings` must be present. (`REQUIRED_FIELD_MISSING`)
- `ssoName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `emailPropertyInProfile`, `userNamePropertyInProfile`, `ssoUserIdPropertyInProfile` must be in the [`dotPath`](./value-formats.md#dotpath) format. (`INVALID_DOT_PATH`)
