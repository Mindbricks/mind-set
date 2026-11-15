# OAuthIdentityGrant

**Level:** `section` · **Family:** [OAuthFlow](../ontology/families.md#oauthflow) (domain `Service`)

**Ontology:** [OAuthIdentityGrant in Part 1](../ontology/OAuthIdentityGrant.md)

**Name:** an instance is named by `identity`.

A single identity grant on an OAuthFlow: the provider VERIFIES `identity` (a user verification column) when `condition` (a JS expression over the normalized OAuth `profile`) is truthy. Applied by the OAuth runtime at login and registration to mark identities verified server-side.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `identity` | `String` | yes |  |  |  | The user verification column this grant marks true when satisfied (e.g. 'emailVerified', 'mobileVerified'; future KYC providers: 'realNameVerified'). |
| `condition` | `String` | yes |  |  |  | A JS boolean expression over the normalized OAuth `profile` (e.g. "profile.emailVerified === true"). Evaluated by the runtime; truthy ⇒ the identity is granted. NOT MScript — emitted verbatim into the generated controller. For an emailVerified grant the generated callback also requires the flow's emailVerification decision (profile.emailVerified === true), so a non-canonical condition only narrows it. |

## Constraints

Property rules:

- `identity`, `condition` must be present. (`REQUIRED_FIELD_MISSING`)
