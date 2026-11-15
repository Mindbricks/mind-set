# PasswordResetByMobile

**Level:** `section` · **Family:** [VerificationServices](../ontology/families.md#verificationservices) (domain `ProjectAuthentication`)

**Ontology:** [PasswordResetByMobile in Part 1](../ontology/PasswordResetByMobile.md)

**Activation:** the pattern is switched on by `passwordResetByMobileIsActive`.

Configuration for enabling password reset via mobile. Specifies token expiration time, resend intervals, and verification type (link or code).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `passwordResetByMobileIsActive` | `Boolean` | no | `false` |  |  | Activates or deactivates the password reset by mobile feature. |
| `configuration` | [`VerificationConfig`](./VerificationConfig.md) | no | `{…}` |  |  | The configuration object for password reset by mobile. Leave it null if passwordResetByMobileIsActive is false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
