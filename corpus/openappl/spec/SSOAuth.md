# SSOAuth

**Level:** `section` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [SSOAuth in Part 1](../ontology/SSOAuth.md)

**Activation:** the pattern is switched on by `useSSOForAuthentication`.

Retained Single Sign-On (SSO) configuration schema. SSO authentication is not available yet: useSSOForAuthentication=true is refused with SSO_NOT_SUPPORTED, even with complete identity provider settings. No SSO login flow, environment variables or deploy secrets are generated.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useSSOForAuthentication` | `Boolean` | yes |  |  |  | Keep false. Setting true is refused at design time with SSO_NOT_SUPPORTED because SSO authentication is not available yet. |
| `configuration` | [`SSOAuthConfig`](./SSOAuthConfig.md) | no |  |  |  | The configuration object for the SSO provider. Leave it null if useSSOForAuthentication is false. |

## Constraints

Property rules:

- `useSSOForAuthentication` must be present. Enforced only while `useSSOForAuthentication` is on. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SSO_CONFIG_MISSING` | error | SSO is enabled (`useSSOForAuthentication: true`) but `configuration.ssoName` is missing. |
| `SSO_NOT_SUPPORTED` | error | SSO authentication is not supported yet. |
