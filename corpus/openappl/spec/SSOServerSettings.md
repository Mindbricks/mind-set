# SSOServerSettings

**Level:** `subsection` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [SSOServerSettings in Part 1](../ontology/SSOServerSettings.md)

Retained endpoint and credential settings for the unavailable SSO feature. These settings do not generate an OAuth2/OIDC flow, environment variables or deploy secrets. Enabling SSO is refused with SSO_NOT_SUPPORTED.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `tokenHost` | `String` | yes |  |  | format [url](./value-formats.md#url) | Declared SSO provider base URL. Current nodejs generation makes no request through this setting and emits no SSO endpoint environment variables or deploy secrets. SSO activation is refused with SSO_NOT_SUPPORTED. Issuer/discovery versus endpoint-prefix semantics and trusted endpoint selection remain undecided. |
| `authPath` | `String` | yes |  |  | format [urlPath](./value-formats.md#urlpath) | The relative path to initiate user authorization on the SSO provider (e.g., /oauth2/authorize). |
| `tokenPath` | `String` | yes |  |  | format [urlPath](./value-formats.md#urlpath) | The relative path to request access tokens from the SSO provider (e.g., /oauth2/token). |
| `userInfoPath` | `String` | yes |  |  | format [urlPath](./value-formats.md#urlpath) | Declared SSO provider user-profile request path. Current nodejs generation makes no request through this setting and emits no SSO endpoint environment variables or deploy secrets. SSO activation is refused with SSO_NOT_SUPPORTED. Verified-token/issuer binding, profile mapping and failure behavior remain undecided. |
| `logoutPath` | `String` | yes |  |  | format [urlPath](./value-formats.md#urlpath) | Declared SSO provider logout path. Current nodejs generation makes no request through this setting and emits no SSO endpoint environment variables or deploy secrets. SSO activation is refused with SSO_NOT_SUPPORTED. Local versus provider logout, redirects and failure behavior remain undecided. |
| `redirectUrl` | `String` | yes |  |  | format [url](./value-formats.md#url) | The full callback URL of the client application to which the SSO provider will redirect after login. This URL must match the one registered with the SSO provider. |
| `clientId` | `String` | yes |  |  | secure | The client identifier issued to your application by the SSO provider. This ID is used to identify your app during the authentication flow. |
| `clientSecret` | `String` | yes |  |  | **secret** | The secret associated with the client ID, used to authenticate your application with the SSO provider when exchanging tokens. |

## Constraints

Property rules:

- `tokenHost`, `authPath`, `tokenPath`, `userInfoPath`, `logoutPath`, `redirectUrl`, `clientId`, `clientSecret` must be present. (`REQUIRED_FIELD_MISSING`)
- `tokenHost`, `redirectUrl` must be in the [`url`](./value-formats.md#url) format. (`INVALID_URL`)
- `authPath`, `tokenPath`, `userInfoPath`, `logoutPath` must be in the [`urlPath`](./value-formats.md#urlpath) format. (`INVALID_URL_PATH`)
