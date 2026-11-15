# PasswordResetByEmail

**Level:** `section` · **Family:** [VerificationServices](../ontology/families.md#verificationservices) (domain `ProjectAuthentication`)

**Ontology:** [PasswordResetByEmail in Part 1](../ontology/PasswordResetByEmail.md)

**Activation:** the pattern is switched on by `passwordResetByEmailIsActive`.

Configuration for enabling password reset via email. Defines whether the feature is active, how long the reset token remains valid, and how frequently a user can request resending the verification message.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `passwordResetByEmailIsActive` | `Boolean` | no | `true` |  |  | Activates or deactivates the password reset by email feature. |
| `configuration` | [`VerificationConfig`](./VerificationConfig.md) | no | `{…}` |  |  | The configuration object for password reset by email. Leave it null if passwordResetByEmailIsActive is false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
