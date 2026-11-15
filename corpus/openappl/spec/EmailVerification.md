# EmailVerification

**Level:** `section` · **Family:** [VerificationServices](../ontology/families.md#verificationservices) (domain `ProjectAuthentication`)

**Ontology:** [EmailVerification in Part 1](../ontology/EmailVerification.md)

**Activation:** the pattern is switched on by `emailVerificationIsActive`.

Defines the settings for verifying a user's email address. Includes token expiration duration, resend interval, and whether verification is handled via link or code.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `emailVerificationIsActive` | `Boolean` | no | `true` |  |  | Enables or disables email verification. |
| `configuration` | [`VerificationConfig`](./VerificationConfig.md) | no | `{…}` |  |  | The configuration object for email verification. Leave it null if emailVerificationIsActive is false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
