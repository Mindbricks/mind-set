# Email2Factor

**Level:** `section` · **Family:** [VerificationServices](../ontology/families.md#verificationservices) (domain `ProjectAuthentication`)

**Ontology:** [Email2Factor in Part 1](../ontology/Email2Factor.md)

**Activation:** the pattern is switched on by `email2FactorIsActive`.

Configuration for email-based two-factor authentication. Activates the feature and defines verification expiration and resend rules.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `email2FactorIsActive` | `Boolean` | no | `true` |  |  | Enables or disables two-factor authentication via email. |
| `configuration` | [`VerificationConfig`](./VerificationConfig.md) | no | `{…}` |  |  | The configuration object for email-based two-factor authentication. Leave it null if email2FactorIsActive is false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
