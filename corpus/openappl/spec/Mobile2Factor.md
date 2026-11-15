# Mobile2Factor

**Level:** `section` · **Family:** [VerificationServices](../ontology/families.md#verificationservices) (domain `ProjectAuthentication`)

**Ontology:** [Mobile2Factor in Part 1](../ontology/Mobile2Factor.md)

**Activation:** the pattern is switched on by `mobile2FactorIsActive`.

Configuration for mobile-based two-factor authentication. Allows setup of token validity duration, resend rate, and type of verification mechanism.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mobile2FactorIsActive` | `Boolean` | no | `false` |  |  | Enables or disables two-factor authentication via mobile. |
| `configuration` | [`VerificationConfig`](./VerificationConfig.md) | no | `{…}` |  |  | The configuration object for mobile-based two-factor authentication. Leave it null if mobile2FactorIsActive is false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
