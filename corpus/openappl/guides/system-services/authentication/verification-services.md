---
title: Verification services
---

# Verification services

The `auth` service provides built-in verification flows used during login, registration,
password reset, and other user operations:

- Password reset (by email or mobile)
- Email verification
- Mobile verification
- Two-factor authentication (2FA) via email or mobile

Each flow follows the same lifecycle:

1. The client calls a **start** endpoint.
2. The server generates a **one-time code** or **link**.
3. The code/link is delivered via email or SMS.
4. The client submits the code or triggers the link.
5. The server completes verification and applies the effect (e.g. resets a password or
   confirms an email). A completed password reset also retires every session of the account:
   a token minted before the reset answers `401`, and the user logs in again with the new
   password.

## Code limits and single use

Email/mobile verification, password reset, and login 2FA share these controls in generated
services:

- A code allows five submissions. Each attempt is reserved atomically before comparison; the
  fifth wrong submission removes the code, and a sixth submission is refused. A correct fifth
  submission can complete the flow.
- A new code starts with zero attempts and an expiry. Six-digit email verification, password
  reset, and login 2FA codes last at most 600 seconds, even when `expireTimeWindow` is longer.
  Mobile flows retain their 300-second lifetime. Link tokens retain their configured lifetime
  and are single use.
- An account can start each flow at most five times in a rolling hour, in addition to the
  existing resend protection (60 seconds by default). Login 2FA retains its resend window per
  pending session; its hourly starts and daily failures are shared by the account across
  pending sessions (every login that reaches the second factor is one start).
- Twenty failures in a rolling 24 hours suppress new codes for that account and flow until the
  failures age out. Requesting a new code does not clear failures; successful verification
  does. Login 2FA counts failures against the user across pending sessions. These controls
  never lock the account.
- A login 2FA start that one of those two account budgets refuses answers `429`
  `errMsg_VerificationStartLimitReached` with `errors: { retryAfterSeconds }`, the seconds
  until the oldest counted start (or failure) ages out of its window; nothing is stored or
  sent, and the refusal costs no failure. A start refused inside the per-session resend window
  keeps its `403` `errMsg_VerificationCodeCanBeSentOnceInTheTimeWindow` and carries the same
  `errors: { retryAfterSeconds }`. The caller has proven a password and holds the pending
  session, so the wait discloses nothing; the client shows it instead of asking for a code
  that was not sent.
- Concurrent correct submissions cannot both apply a password, contact or session change: the
  code is consumed atomically before the change.

Anonymous completion uses the same `403` `errMsg_VerificationCodeIsNotAuthorized` response for
an unknown account, missing or expired code, wrong code, and exhausted attempts. Password reset
requires the new password before reserving an attempt. Login 2FA retains its distinct
expired-challenge response. An anonymous start (verification, password reset) suppressed by the
daily failure limit retains its normal response shape and sends no code, so an unknown and a
known identifier stay indistinguishable; a login 2FA start suppressed the same way answers the
`429` wait above.

Failed attempts and reached limits are audited without recording the code. Reached limits
publish an event; password reset also notifies the user through the flow's email or SMS
channel. Limits are runtime constants rather than blueprint settings. Test-mode code visibility
follows the existing policy (see below).

Per-account limits apply by default. Deployments can additionally opt into an approximately
30-request-per-minute IP token bucket for anonymous start and complete routes with
`VERIFICATION_IP_RATE_LIMIT_ENABLED=true`; it is off by default.

The delivery channel is a notification provider declared under
`projectSettings.notificationProvidersSettings.notificationProviders[]`. Every flow also
publishes a start and a complete Kafka topic, which the notification service consumes to send
the code and which your own services can subscribe to (topic names and payloads are part of
[the compiler specification](../../../compiler/index.md)).

## Configuration structure

All verification services live under `authentication.verificationServices`
([`VerificationServices`](../../../spec/VerificationServices.md)). Each verification type has
an `isActive` flag (e.g. `passwordResetByEmailIsActive`) and a `configuration` object
implementing [`VerificationConfig`](../../../spec/VerificationConfig.md):

```json
{
  "authentication": {
    "verificationServices": {
      "passwordResetByEmail": {
        "passwordResetByEmailIsActive": true,
        "configuration": {
          "resendTimeWindow": 3600,
          "expireTimeWindow": 86400,
          "verificationType": "byCode",
          "verificationTemplate": "<p>Your password reset code is <%= secretCode %>. It expires in <%= expireTime %> seconds.</p>"
        }
      }
    }
  }
}
```

[`VerificationServices`](../../../spec/VerificationServices.md) carries the global settings
plus the following optional flows:

| Field | Purpose |
|---|---|
| `verificationSettings` | Its only field, `verificationMode`, has no effect (see below). |
| `passwordResetByEmail` / `passwordResetByMobile` | Forgot-password loops. |
| `emailVerification` / `mobileVerification` | One-time verification of contact identifiers. |
| `email2Factor` / `mobile2Factor` | Two-factor at login or for sensitive actions. |

## Shared settings (`VerificationConfig`)

1. **`resendTimeWindow`** (seconds): how often a user can request a new code:

   ```json
   {
     "authentication": {
       "verificationServices": {
         "passwordResetByEmail": { "configuration": { "resendTimeWindow": 3600 } },
         "mobileVerification": { "configuration": { "resendTimeWindow": 60 } }
       }
     }
   }
   ```

   The window is claimed atomically when a `start` is accepted (a set-if-absent with an expiry
   of the window length), so parallel starts for one resend identity send exactly one code and
   every other start in the burst answers `403`
   `errMsg_VerificationCodeCanBeSentOnceInTheTimeWindow`. A start refused for a storage error
   never releases another request's claim. The minimum window is 60 seconds, including when
   the configured value is `0`. Login 2FA claims the window per pending session, so two logins
   of one user inside the window each receive their own code, and its `403` carries
   `errors: { retryAfterSeconds }` (the enrolment start does the same); other
   verification/reset flows retain their account scope and their uniform answer. Hourly and
   daily account limits still apply.

2. **`expireTimeWindow`** (seconds): the requested lifetime after issuance. The six-digit code
   caps above still apply; a longer value is useful for a by-link flow:

   ```json
   {
     "authentication": {
       "verificationServices": {
         "passwordResetByEmail": { "configuration": { "expireTimeWindow": 86400 } },
         "mobile2Factor": { "configuration": { "expireTimeWindow": 300 } }
       }
     }
   }
   ```

3. **`verificationType`**: `"byCode"` or `"byLink"`:

   ```json
   {
     "authentication": {
       "verificationServices": {
         "passwordResetByEmail": { "configuration": { "verificationType": "byLink" } },
         "passwordResetByMobile": { "configuration": { "verificationType": "byCode" } }
       }
     }
   }
   ```

   ```plaintext
   Common convention:
   - Use "byLink" for email-based verifications.
   - Use "byCode" for mobile (SMS) verifications.
   ```

4. **`verificationTemplate`**: the inline EJS source used to render the verification message.
   The template receives `secretCode`, `userId`, `codeIndex`, `expireTime`, and
   `verificationType`, so one template can branch between `byLink` and `byCode` flows. Each
   flow ships with a full default template inline in its configuration.

## Action approval: the Business API approval gate

There is no standalone "approve by email / by mobile" verification flow: `VerificationServices`
has no block for one, a blueprint that carries such a key (for example
`completeActionApproveByEmail`) is refused by validation (`UNKNOWN_PROPERTY`), and no
`/verify/action-approve-...` route is generated. A free-standing start / complete pair would
approve nothing in particular, because nothing would tie the approval to the operation it is
meant for.

A critical operation is approved where it runs: declare `authOptions.requireApproval` on the
Business API ([`ApiApprovalRequirement`](../../../spec/ApiApprovalRequirement.md)):

```json
{
  "authOptions": {
    "loginRequired": true,
    "requireApproval": { "channel": "email", "actionName": "Close account" }
  }
}
```

- The api answers its first call with **403 `APPROVAL_REQUIRED`** and sends a one-time code to
  the caller's own verified email (or mobile). The caller repeats the **same request** with the
  `api-approval-id` and `api-approval-code` headers, and the api runs. The approval is bound to
  that user, that api and the request's declared parameters, is used once, expires (15 minutes
  for email, 5 for mobile, unless `expireTimeWindow` says otherwise) and allows 5 wrong codes.
- The check is a fixed milestone of the api pipeline, after every authorization check and
  before the first stage that may write. The full contract (the milestone, the failure shapes,
  the doors) is on [Business API
  auth](./business-api-auth.md#step-up-approval-requireapproval).
- The channel's identity must be a **required** identity of your users
  (`APPROVAL_ON_OPTIONAL_IDENTITY` otherwise), because a user without it could never approve.
- A by-link / other-device approval (clicking a link in the mail on another device) is **not
  supported**.

The approval code is **sent by the framework** like every verification code: the api's service
publishes it on `<codename>-auth-service-email-actApp-start` (or `mobile-actApp-start`), and
the notification service carries a framework event on that topic (`apiApprovalByEmail` /
`apiApprovalByMobile`) whenever an api of the project declares `requireApproval` on that
channel. The provider is resolved like the other flows: the channel's default provider, else
the first provider of that kind (or `multi`), else the built-in mail sink / SMS sink. So with
no provider declared the code goes to the sink on every deployment, and validation lists the
message in `MAIL_FLOWS_GO_TO_SINK` / `SMS_FLOWS_GO_TO_SINK`.

- The message is the framework's own text: the code, the api's `actionName` and
  `actionDescription`, and the time left.
- A project that authored its own `EventNotification` of the same `jobType` on that topic keeps
  it: the comparison is case-insensitive (`sms`, `SMS` and `Sms` all match), and the framework
  event is then not added, so the code is not sent twice. The topic index recognizes each
  declared approval channel as produced by the api, so the authored notification passes topic
  validation.
- In a test deployment mode the challenge also carries the code (the `secretCode` of the 403
  body's `errors`), as for the other flows (see the next section); a production deployment
  never returns it.

## Where the code comes from: test mode and live mode

Whether a verification `start` / `complete` answer carries the secret code is decided by the
**deployment mode**, never by the blueprint:

| Deployment mode | Code in the API answer | Where a tester finds the code |
|---|---|---|
| Test mode (development, preview-style deployments) | Yes: `start` also returns `secretCode` (and `userId`), the email/mobile verification and password-reset `complete` return `userId`, and a Business API approval challenge carries `secretCode`. | In the response, and also in the sinks below. |
| Live mode (staging that serves real users, production) | **Never.** | The real inbox or handset when the mail / SMS provider has its credentials set; otherwise the deployment's sinks (below). |

A live deployment is a real, reachable environment with real users, so it answers exactly like
production. Build frontends so that no flow depends on `secretCode` being in the response; show
it only when it is present.

Where the code is **sent** depends on the provider, and for a declared SMS provider without
credentials also on whether the deployment is production:

| Channel | Provider with credentials set | Provider declared, credentials missing | No provider declared |
|---|---|---|---|
| Email | Delivered for real. | The built-in **mail sink** (every deployment). | The mail sink: the framework resolves the email flows against a last-resort entry aimed at it. |
| SMS | Delivered for real. | The built-in **SMS sink** on development, test and staging deployments; the send **fails** on production. | The built-in **SMS sink** on every deployment, production included. The framework resolves the mobile flows against a last-resort entry aimed at it, the same rule the mail side follows. Validation warns once with `SMS_FLOWS_GO_TO_SINK` (non-blocking). Declare a real SMS provider before production users need their codes on a handset. |

The SMS sink is not a second service: it stores each SMS in the **mail sink** as one mail
addressed to `sms-<digits of the number>@sms-sink.invalid` (`+90 555 111 22 33` becomes
`sms-905551112233@sms-sink.invalid`), subject `SMS to <number>`, with the SMS text as the
body.

### Reading the sinks

- The mail sink is an inbox (a mail-catcher) of the deployment; sunk mail and sunk SMS are both
  there. Search for `sms-sink.invalid`, or for the digits of the number, to find an SMS.
- **Is a sink engaged here?** `GET /v1/mail/mock-status` on the notification service answers
  it: the `sink` block for mail, the `smsSink` block for SMS (`slotAllowsSink` is `false` on
  production).

### `verificationMode` has no effect

`verificationServices.verificationSettings.verificationMode` (`testMode` / `liveMode`) does not
decide anything: a blueprint that carries it validates and builds, but the deployment alone
picks test or live mode (the table above). A value other than the default `testMode` draws the
`VERIFICATION_MODE_INERT` warning; the setting can simply be removed.

## Verification URLs (for `byLink`)

With `"byLink"`, the compiler generates a link to a path on your frontend. The exact path is
determined by your frontend design; typical patterns:

```plaintext
https://app.myApp.com/passwordResetByEmail/{hash}
https://app.myApp.com/mobileVerification/{hash}
https://app.myApp.com/emailVerification/{hash}
...
```

The frontend must handle each verification path that matches your configuration and API guide.

## Subject and frontend URL

Each of the six verification, password-reset and 2FA flows accepts optional
`configuration.subjectTemplate` (EJS). An absent or blank subject retains its existing English
text. Body and subject share the verification payload locals, including `user`, `expireTime`,
`secretCode`, and `frontendURL` from the notification service environment variable
`FRONTEND_URL` (empty when unset).

For example, `subjectTemplate: "Account verification for <%= user.email %>"` and a body link
`<%= frontendURL %>/verify?code=<%= secretCode %>` localize the message without adding another
EventNotification. The subject is retained in notificationLog; keep secretCode only in the
sensitive body. Design validation emits `VERIFICATION_SUBJECT_SECRET_CODE` when the subject
references it. This field does not add language selection or change the flow activation and
authored approval-event policies.

## See also

- [Login](./login.md): verification-during-login and 2FA gating.
- [Users](./users.md): the `emailVerified` / `mobileVerified` flags.
- Spec: [`VerificationServices`](../../../spec/VerificationServices.md),
  [`VerificationConfig`](../../../spec/VerificationConfig.md),
  [`VerificationSettings`](../../../spec/VerificationSettings.md).
