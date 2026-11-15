# ReadMailAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ReadMailAction in Part 1](../ontology/ReadMailAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Fetches ONE full message from a MailAccount's mailbox by its RFC 5322 `messageId` — bodies (`text`/`html`) plus attachment content — and stores it in the context. This is the on-demand content path of the mail family (docs/ADR-mail-account-family.md §3): the `new-email-arrived` Kafka envelope and CheckMailboxAction summaries carry attachment METADATA only, and a consumer that needs the bytes reads them through this action. Attachment items arrive as `{ filename, mimeType, size, contentBase64 }`. The mailbox is reached through the mcpbff mail bridge over signed M2M; credentials never enter this service (§4/§10).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mailAccount` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Codename of a `projectSettings.mailAccountsSettings.mailAccounts[]` entry — the mailbox to read from. An unresolvable name is rejected at project-validation time (`UNKNOWN_MAIL_ACCOUNT`). A mailbox TEMPLATE (ownerScope tenant or user) may be named too (nodejs): `mailbox` then says which connected mailbox. |
| `messageId` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression evaluating to the RFC 5322 Message-ID of the message to fetch (angle brackets optional) — typically `this.newMail.messageId` from the `new-email-arrived` envelope, or a CheckMailboxAction summary's `messageId`. An unknown id makes the action fail with `MESSAGE_NOT_FOUND`. |
| `mailbox` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression naming ONE connected mailbox when `mailAccount` is a mailbox TEMPLATE (ownerScope tenant or user); refused on a project account (MAIL_ACCOUNT_MAILBOX_ON_PROJECT) and required on a template (MAIL_ACCOUNT_TEMPLATE_STATIC_REFERENCE without it). It evaluates either to the `mailbox` object a connected-mailbox event carries (`{ credentialKey, ownerId, scope, tenantId }`, for example `this.mailbox` when the api declares a body parameter `mailbox`, or `this.request.event.data.mailbox`), or to a string, the mailbox key (its lowercase address) of a mailbox the SESSION owner connected to the template (the user for a user template, the session's tenant for a tenant template). The mcpbff admits the call only when the caller owns the mailbox: the session user for a user template; a tenantOwner / tenantAdmin of that tenant for a tenant template; or the event context of a Kafka-triggered run whose actor is the owner (the system session minted in the event's tenant, acting for the event's user). Any other caller gets MAILBOX_NOT_FOUND, whether the mailbox exists or not. nodejs, rust, dotnet and java; other languages refuse a template (MAIL_ACCOUNT_TEMPLATE_LANGUAGE_UNSUPPORTED). |
| `markSeen` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression evaluating to a boolean. When true, the message's `\Seen` flag is set after a successful read. Default FALSE: on an autoListen account the seen flag is the listener's delivery cursor (docs/ADR-mail-account-family.md §6) — marking a not-yet-published message seen would eat its Kafka delivery. |
| `includeAttachments` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression evaluating to a boolean. When true (the default), each attachment's bytes are returned base64-encoded in `contentBase64`; set to `false` to fetch bodies only (attachment items then carry metadata with `contentBase64: null`). |

## Constraints

Property rules:

- `mailAccount`, `messageId` must be present. (`REQUIRED_FIELD_MISSING`)
- `mailAccount` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

## Example

Use inside a mail-triggered workflow (or after a CheckMailboxAction) to load a message's bodies and attachment bytes by messageId — e.g. reading the PDF out of an invoice mail before booking it.

```json
{
  "name": "readInvoiceMail",
  "description": "Fetch the full invoice mail (including the attached PDF) that triggered this workflow.",
  "mailAccount": "invoices",
  "messageId": { "js": "this.newMail.messageId" },
  "markSeen": { "js": "false" }
}
```
