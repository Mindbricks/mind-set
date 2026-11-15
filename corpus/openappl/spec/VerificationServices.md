# VerificationServices

**Level:** `chapter` · **Family:** [VerificationServices](../ontology/families.md#verificationservices) (domain `ProjectAuthentication`)

**Ontology:** [VerificationServices in Part 1](../ontology/VerificationServices.md)

Defines user-related verification features such as password resets and two-factor authentication (2FA). An OpenAPPL compiler generates backend support code for these features automatically, based on this configuration, as part of the user service module.

WHERE THE CODE GOES, PER DEPLOYMENT SLOT. Preview and a local dev stack answer start/complete WITH the secret code, so a flow completes without a mailbox or handset. Stage and production NEVER put the code in the answer. On every slot the code is also sent: through the configured mail/SMS provider when its credentials are set; otherwise mail goes to the built-in mail sink (every slot) and SMS goes to the built-in SMS sink on dev, preview and stage, which stores each SMS in the mail sink as a mail to sms-<digits>@sms-sink.invalid. Production has no SMS sink for a DECLARED sms provider without credentials: the send fails there. A project that declares NO sms provider sends every SMS to the SMS sink on every slot, production included - the mail sink's rule for a project without a mail provider - so its mobile flows are built, no VERIFICATION_FLOW_MISSING_PROVIDER is reported, and validation warns once with SMS_FLOWS_GO_TO_SINK (non-blocking) until a real sms provider is declared. On the local FARM both sinks are read in the Mailpit inbox (http://localhost:18025); where a stage deployment's sink inbox is read is not documented yet. A project that declares NO email provider sends its email flows to the mail sink on every slot, production included, and validation warns once with MAIL_FLOWS_GO_TO_SINK (non-blocking) until a real email provider is declared.

NO APPROVE FLOW. There is no approve-by-email / approve-by-mobile verification flow and no block for one: the standalone action-approve flows (a start / complete pair keyed by a caller-chosen action id) are retired, and a blueprint carrying `completeActionApproveByEmail` / `completeActionApproveByMobile` is refused UNKNOWN_PROPERTY. A critical operation asks for a step-up approval where it runs: `authOptions.requireApproval` on the Business API (ApiApprovalRequirement), a fixed pipeline milestone after the authorization checks and before the first write, bound to the call's input.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `verificationSettings` | [`VerificationSettings`](./VerificationSettings.md) | yes |  |  |  | General options for all verifications. Its only field, verificationMode, is RETIRED: whether a verification answer carries the code is decided by the deployment slot, not by the blueprint. |
| `passwordResetByEmail` | [`PasswordResetByEmail`](./PasswordResetByEmail.md) | no |  |  |  | Configures email-based password reset functionality. Includes template, expiration, and verification strategy (link or code). |
| `passwordResetByMobile` | [`PasswordResetByMobile`](./PasswordResetByMobile.md) | no |  |  |  | Configures SMS-based password reset functionality. Requires active mobile field in user schema. |
| `email2Factor` | [`Email2Factor`](./Email2Factor.md) | no |  |  |  | Enables and configures two-factor authentication via email. Typically used during login or sensitive actions. |
| `mobile2Factor` | [`Mobile2Factor`](./Mobile2Factor.md) | no |  |  |  | Enables and configures two-factor authentication via SMS. Requires mobile phone to be active in user schema. |
| `emailVerification` | [`EmailVerification`](./EmailVerification.md) | no |  |  |  | Configures email verification flow, including delivery method (link or code), expiration, and resend timing. |
| `mobileVerification` | [`MobileVerification`](./MobileVerification.md) | no |  |  |  | Configures mobile verification flow via SMS, with support for link-based or code-based confirmation. The SMS goes through the project's declared sms provider; on dev, preview and stage a provider whose credentials are not set sends to the built-in SMS sink instead, while production fails the send. With no sms provider declared the SMS goes to the SMS sink on every deployment (see VerificationServices). |

## Constraints

Property rules:

- `verificationSettings` must be present. (`REQUIRED_FIELD_MISSING`)
