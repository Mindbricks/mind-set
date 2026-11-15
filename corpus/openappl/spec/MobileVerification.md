# MobileVerification

**Level:** `section` · **Family:** [VerificationServices](../ontology/families.md#verificationservices) (domain `ProjectAuthentication`)

**Ontology:** [MobileVerification in Part 1](../ontology/MobileVerification.md)

**Activation:** the pattern is switched on by `mobileVerificationIsActive`.

Defines the settings for verifying a user's mobile number. Includes resend interval, expiration period, and verification method (link or code).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mobileVerificationIsActive` | `Boolean` | no | `false` |  |  | Enables or disables mobile verification. |
| `configuration` | [`VerificationConfig`](./VerificationConfig.md) | no | `{…}` |  |  | The configuration object for mobile verification. Leave it null if mobileVerificationIsActive is false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
