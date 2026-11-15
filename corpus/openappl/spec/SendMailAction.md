# SendMailAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [SendMailAction in Part 1](../ontology/SendMailAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Sends an email using a configured email provider — or, when `mailAccount` is set, ON BEHALF OF a project MailAccount through the mcpbff mail bridge (docs/ADR-mail-account-family.md). The subject, body, and recipient addresses are defined via MScript and can be dynamically constructed from context. With `inReplyTo`/`references` the send becomes a threaded reply that real mail clients keep inside the original conversation. This action is commonly used for transactional notifications, confirmations, alerts, and mailbox replies.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Codename of the configured email provider. Must match an entry in `projectSettings.notificationProvidersSettings.notificationProviders[].name` with `kind: 'email'` (or `kind: 'multi'`). The action handler imports the matching native-integration client from `_common/notification-providers/email/<resolvedProvider>` and calls `provider.send(payload)` directly — no kafka hop, no interservice call. When omitted, the project default `notificationService.serviceSettings.serviceOptions.defaultEmailProviderName` is used. An unresolvable name throws `UnknownNotificationProvider`; a kind mismatch throws `IncompatibleProviderKind` at project-validation time. Exactly one transport must be chosen: set `provider` OR `mailAccount`, never both. |
| `mailAccount` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Codename of a `projectSettings.mailAccountsSettings.mailAccounts[]` entry. When set, the mail goes out ON BEHALF OF that mailbox identity through its own connector (SMTP for v1) instead of a NotificationProvider: the runtime calls the mcpbff mail bridge over signed M2M (the account's credentials exist only in the mcpbff deployable — see docs/ADR-mail-account-family.md §4/§10), the `From` header is ALWAYS the account's `address` (any `from` expression is ignored), and the account's `sendEnabled`/`replyEnabled` gates are enforced at send time. Mutually exclusive with `provider`. A mailbox TEMPLATE (ownerScope tenant or user) may be named too (nodejs): `mailbox` then says which connected mailbox, and the reply goes out from that owner's own mailbox. |
| `mailbox` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression naming ONE connected mailbox when `mailAccount` is a mailbox TEMPLATE (ownerScope tenant or user); refused on a project account (MAIL_ACCOUNT_MAILBOX_ON_PROJECT) and required on a template (MAIL_ACCOUNT_TEMPLATE_STATIC_REFERENCE without it). It evaluates either to the `mailbox` object a connected-mailbox event carries (`{ credentialKey, ownerId, scope, tenantId }`, for example `this.mailbox` when the api declares a body parameter `mailbox`, or `this.request.event.data.mailbox`), or to a string, the mailbox key (its lowercase address) of a mailbox the SESSION owner connected to the template (the user for a user template, the session's tenant for a tenant template). The mcpbff admits the call only when the caller owns the mailbox: the session user for a user template; a tenantOwner / tenantAdmin of that tenant for a tenant template; or the event context of a Kafka-triggered run whose actor is the owner (the system session minted in the event's tenant, acting for the event's user). Any other caller gets MAILBOX_NOT_FOUND, whether the mailbox exists or not. nodejs, rust, dotnet and java; other languages refuse a template (MAIL_ACCOUNT_TEMPLATE_LANGUAGE_UNSUPPORTED). |
| `subject` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the email subject. Can include context variables like `this.user.name`. |
| `body` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the email content, usually a rendered HTML or plaintext string. Often prepared using `RenderDataAction`. |
| `to` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the recipient email address (or a list of addresses). |
| `from` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript expression defining the sender email address. Can be static or context-driven. Ignored on the `mailAccount` path — an on-behalf send is always From the account's own address. |
| `cc` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression to specify CC recipients. Can be a single address or array. |
| `attachments` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression that resolves to an array of attachment objects. Each item must have the shape `{ fileName: string, content: Buffer \| base64-string, contentType: string }`. Typically populated from upstream actions — most commonly `RenderPdfAction`, whose stored context object already matches this shape (e.g., `{ "js": "[this.invoicePdf]" }`). |
| `inReplyTo` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression that evaluates to the RFC 5322 Message-ID of the message being replied to (as delivered in the `new-email-arrived` envelope or a ReadMailAction result, e.g. `{ "js": "this.newMail.messageId" }`). When set, the send is a REPLY: the id is emitted as the `In-Reply-To` header (and appended to `References`) so real mail clients thread the reply under the original. On the `mailAccount` path the account's `replyEnabled` gate applies; on the provider path the header is passed through where the provider supports custom headers. |
| `references` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression that evaluates to the full thread chain of RFC 5322 Message-IDs, oldest first (e.g. `{ "js": "this.newMail.references" }`). Emitted as the `References` header; when `inReplyTo` is set and missing from the list, it is appended automatically so the chain stays RFC-complete. |

## Constraints

Property rules:

- `subject`, `body`, `to` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider`, `mailAccount` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `MAIL_TRANSPORT_CONFLICT` | error | SendMailAction cannot use both `provider` and `mailAccount` — pick one transport per action. |
| `MAIL_TRANSPORT_REQUIRED` | error | SendMailAction needs a transport: set `provider` (a notification provider) or `mailAccount` (an on-behalf project mailbox). |

## Example

Use to send a transactional email via a configured email provider — subject/body/recipients built from context, with optional attachments such as a rendered invoice PDF from a prior RenderPdfAction.

```json
{
  "name": "sendInvoiceEmail",
  "description": "Email the customer their invoice with the rendered PDF attached.",
  "provider": "sendgridPrimary",
  "to": { "js": "this.customer.email" },
  "from": { "js": "'billing@example.com'" },
  "subject": { "js": "`Invoice ${this.invoice.number} from Example Inc`" },
  "body": { "js": "this.emailBody" },
  "attachments": { "js": "[this.invoicePdf]" }
}
```
