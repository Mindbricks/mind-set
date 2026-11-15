# VerificationConfig

**Level:** `subsection` · **Family:** [VerificationServices](../ontology/families.md#verificationservices) (domain `ProjectAuthentication`)

**Ontology:** [VerificationConfig in Part 1](../ontology/VerificationConfig.md)

Defines the configuration for verification flows, including password resets and two-factor authentication. This object is used when the respective feature is active.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `subjectTemplate` | `Text` | no |  |  |  | Optional EJS subject for all six verification, password-reset and 2FA flows. Absent or blank retains the existing English subject. Uses the same locals as verificationTemplate: user, expireTime, secretCode and frontendURL (the notification service FRONTEND_URL, empty when unset). Subjects are retained in notificationLog; never include secretCode. A reference produces VERIFICATION_SUBJECT_SECRET_CODE warning. |
| `resendTimeWindow` | `Integer` | no | `60` |  |  | Interval in seconds before the user can request another verification message. |
| `expireTimeWindow` | `Integer` | no | `86400` |  |  | Duration in seconds after which the verification link/code expires. |
| `verificationType` | `VerificationType` | no | `"byCode"` | `byLink`, `byCode` |  | Specifies whether verification is triggered by clicking a link or entering a code. |
| `verificationTemplate` | `Text` | yes |  |  |  | An ejs template source to render the message that will be sent to the user for the verification process. The template will be rendered with the verification data that includes the user object. The framework sends it through the notification service for every active flow. (There is no approve-by-email / approve-by-mobile flow: the standalone action-approve flows are retired. A Business API asks for a step-up approval through authOptions.requireApproval, whose message is the framework's approval text and has no template field.) Body and subject share frontendURL from FRONTEND_URL (empty when unset), user, secretCode and expireTime. |

## Constraints

Property rules:

- `verificationTemplate` must be present. (`REQUIRED_FIELD_MISSING`)
- `verificationType` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `VERIFICATION_SUBJECT_SECRET_CODE` | warning | Verification subjects are retained in notificationLog. |
