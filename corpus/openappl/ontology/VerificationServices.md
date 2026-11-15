# VerificationServices

**Level:** `chapter` · **Family:** [VerificationServices](./families.md#verificationservices) (domain `ProjectAuthentication`)

**Specification:** [VerificationServices in Part 2](../spec/VerificationServices.md)

Defines user-related verification features such as password resets and two-factor authentication (2FA). An OpenAPPL compiler generates backend support code for these features automatically, based on this configuration, as part of the user service module.

WHERE THE CODE GOES, PER DEPLOYMENT SLOT. Preview and a local dev stack answer start/complete WITH the secret code, so a flow completes without a mailbox or handset. Stage and production NEVER put the code in the answer. On every slot the code is also sent: through the configured mail/SMS provider when its credentials are set; otherwise mail goes to the built-in mail sink (every slot) and SMS goes to the built-in SMS sink on dev, preview and stage, which stores each SMS in the mail sink as a mail to sms-<digits>@sms-sink.invalid. Production has no SMS sink for a DECLARED sms provider without credentials: the send fails there. A project that declares NO sms provider sends every SMS to the SMS sink on every slot, production included - the mail sink's rule for a project without a mail provider - so its mobile flows are built, no VERIFICATION_FLOW_MISSING_PROVIDER is reported, and validation warns once with SMS_FLOWS_GO_TO_SINK (non-blocking) until a real sms provider is declared. On the local FARM both sinks are read in the Mailpit inbox (http://localhost:18025); where a stage deployment's sink inbox is read is not documented yet. A project that declares NO email provider sends its email flows to the mail sink on every slot, production included, and validation warns once with MAIL_FLOWS_GO_TO_SINK (non-blocking) until a real email provider is declared.

NO APPROVE FLOW. There is no approve-by-email / approve-by-mobile verification flow and no block for one: the standalone action-approve flows (a start / complete pair keyed by a caller-chosen action id) are retired, and a blueprint carrying `completeActionApproveByEmail` / `completeActionApproveByMobile` is refused UNKNOWN_PROPERTY. A critical operation asks for a step-up approval where it runs: `authOptions.requireApproval` on the Business API (ApiApprovalRequirement), a fixed pipeline milestone after the authorization checks and before the first write, bound to the call's input.

## Contained in

- [ProjectAuthentication](./ProjectAuthentication.md) as `verificationServices`

Blueprint paths:

- `authentication.verificationServices`

## Contains

- `verificationSettings`: [VerificationSettings](./VerificationSettings.md)
- `passwordResetByEmail`: [PasswordResetByEmail](./PasswordResetByEmail.md)
- `passwordResetByMobile`: [PasswordResetByMobile](./PasswordResetByMobile.md)
- `email2Factor`: [Email2Factor](./Email2Factor.md)
- `mobile2Factor`: [Mobile2Factor](./Mobile2Factor.md)
- `emailVerification`: [EmailVerification](./EmailVerification.md)
- `mobileVerification`: [MobileVerification](./MobileVerification.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
