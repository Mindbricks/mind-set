# VerificationSettings

**Level:** `section` · **Family:** [VerificationServices](../ontology/families.md#verificationservices) (domain `ProjectAuthentication`)

**Ontology:** [VerificationSettings in Part 1](../ontology/VerificationSettings.md)

General options for all verifications. Its only field, verificationMode, is RETIRED and has no effect: the deployment slot decides whether a verification answer carries the code.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `verificationMode` | `VerificationMode` | no | `"testMode"` | `testMode`, `liveMode` |  | RETIRED - leave it at the default or remove it; the value has no effect. The deployment slot alone decides whether the verification start/complete answers carry the secret code (and the userId): the preview deployment and a local dev stack always answer with them, so flows can be completed without a mailbox; stage and production never do, whatever this field says, and the code reaches the user only through the configured mail/SMS provider (or a sink: mail with no complete mail provider goes to the deployment's mail sink, on dev, preview and stage an SMS whose sms provider has no credentials set goes to the SMS sink, which stores it in the mail sink as a mail to sms-<digits>@sms-sink.invalid, and a project with no sms provider sends every SMS there on every deployment). It used to let stage follow the blueprint; a stage deployment is a real, reachable environment with real users, so that no longer depends on one blueprint value. A blueprint carrying the field still validates; a value other than the default draws the VERIFICATION_MODE_INERT warning. |

## Constraints

Property rules:

- `verificationMode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
