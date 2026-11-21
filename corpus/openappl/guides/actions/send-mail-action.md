---
title: SendMailAction
---

# SendMailAction

`SendMailAction` sends an email through **exactly one of two transports**:

- **`provider`**: a configured native notification provider. Provider selection happens at design time by codename, and the action talks to the provider directly with no Kafka hop or interservice call.
- **`mailAccount`**: a project [`MailAccount`](../../spec/MailAccount.md). The mail goes out **on behalf of** that mailbox identity through the mail bridge of the mcpbff service over signed M2M: `From` is always the account's `address`, the account's `sendEnabled`/`replyEnabled` gates apply, and its credentials never enter the calling service.

Subject, body, and recipients are MScript expressions built from context. With `inReplyTo`/`references` the send becomes a **threaded reply** that real mail clients keep inside the original conversation.

## When to use it

- Transactional notifications: order confirmations, invoice deliveries, password resets (provider path).
- Operational alerts: monitoring triggers, manual approvals (provider path).
- Replying inside an existing mail thread as a real mailbox: support answers, invoice follow-ups (mailAccount path with `inReplyTo`).
- Any send that must originate from a stateful mailbox identity rather than a no-reply channel (mailAccount path).

For SMS, push, or WhatsApp use the sibling actions: [`SendSmsAction`](./send-sms-action.md), [`SendPushNotificationAction`](./send-push-notification-action.md), [`SendWhatsAppAction`](./send-whatsapp-action.md).

A null, undefined, empty, or whitespace-only `to` is refused with
`ApiError(400, 'Notification recipient is empty')` before provider setup or sending.
The recipient expression is evaluated once. The mail-account transport keeps
recipient arrays as arrays. Every array position must contain a non-null, non-blank recipient, including positions
omitted in sparse arrays such as `[,]` or `["ok@example.test",,]`. These arrays
are refused before the mail bridge is loaded. Accepted arrays are passed unchanged,
including recipient spelling and spacing.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `provider` | `String` | ◐ | Codename of the configured email provider: an entry in `projectSettings.notificationProvidersSettings.notificationProviders[].name` with `kind: "email"` (or `"multi"`). Exactly one of `provider`/`mailAccount` must be set (`MAIL_TRANSPORT_REQUIRED` / `MAIL_TRANSPORT_CONFLICT`). |
| `mailAccount` | `String` | ◐ | Codename of a `projectSettings.mailAccountsSettings.mailAccounts[]` entry to send on behalf of. Unknown names fail validation (`UNKNOWN_MAIL_ACCOUNT`); a `sendEnabled: false` account is rejected at design time (`MAIL_ACCOUNT_SEND_DISABLED`). A mailbox template (`ownerScope` `tenant` / `user`) may be named too: `mailbox` then says which connected mailbox and the mail goes out FROM that owner's address; a template without `mailbox` is refused (`MAIL_ACCOUNT_TEMPLATE_STATIC_REFERENCE`). A compiler that does not implement mailbox templates refuses the reference with `MAIL_ACCOUNT_TEMPLATE_LANGUAGE_UNSUPPORTED`. |
| `mailbox` | `MScript` | ◐ | Template only: the ONE connected mailbox to send from. The `mailbox` object of the connected-mailbox event that triggered the api (`this.mailbox`), or the address of a mailbox the session owner connected. Owner-checked by the mail bridge (`MAILBOX_NOT_FOUND` for anyone else); refused on a project account (`MAIL_ACCOUNT_MAILBOX_ON_PROJECT`). A reply to a mail the owner received therefore leaves from the owner's own mailbox. See [Connected mailboxes](../capabilities/connected-mailboxes.md#using-a-connected-mailbox-from-the-backend). |
| `subject` | `MScript` | ✓ | Expression evaluating to the email subject. |
| `body` | `MScript` | ✓ | Expression evaluating to the email body, usually a rendered HTML or plaintext string, frequently prepared by [`RenderDataAction`](./render-data-action.md). |
| `to` | `MScript` | ✓ | Expression evaluating to the recipient address (string) or addresses (array). |
| `from` | `MScript` |   | Sender address (provider path only). **Ignored on the mailAccount path**: an on-behalf send is always From the account's own address. |
| `cc` | `MScript` |   | CC recipient(s). |
| `attachments` | `MScript` |   | Array of `{ fileName, content: Buffer \| base64-string, contentType }` items: the [`RenderPdfAction`](./render-pdf-action.md) output shape (e.g. `[this.invoicePdf]`). Works on both paths. |
| `inReplyTo` | `MScript` |   | RFC 5322 Message-ID of the message being replied to (e.g. `this.newMail.messageId`). Emitted as the `In-Reply-To` header and appended to `References`, so clients thread the reply. On the mailAccount path the account's `replyEnabled` gate applies. |
| `references` | `MScript` |   | Full thread chain of Message-IDs, oldest first (e.g. `this.newMail.references`). Emitted as the `References` header; `inReplyTo` is appended automatically when missing. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

**Provider path.** The `provider` codename is resolved at compile time and the send goes through the native notification provider bound to it (credentials are supplied per provider by the deployment). Threading fields ride in the message metadata and are emitted as real headers by the adapters that support custom headers (smtp, sendgrid, resend). Returns `result.success` (boolean). A failed send throws `NotificationSendError`; the workflow stage wrapper handles it per `onActionError`.

**MailAccount path.** The action sends through the mail bridge: a signed M2M `POST /bridge/mail/:account/send` on the mcpbff service, which drives the account's SMTP connector: `From` = the account's address, `In-Reply-To`/`References` set natively, attachments transported base64. Returns `{ messageId }`, the outgoing Message-ID, ready to store for further threading. `sendEnabled`/`replyEnabled` violations reject with `MailBridgeError('MAIL_SEND_DISABLED')`.

## Example

Reply on behalf of the support mailbox to the mail that triggered the workflow:

```json
{
  "name": "sendReply",
  "mailAccount": "support",
  "to": { "js": "this.newMail.from.address" },
  "subject": { "js": "`Re: ${this.newMail.subject}`" },
  "body": { "js": "this.replyBody" },
  "inReplyTo": { "js": "this.newMail.messageId" },
  "references": { "js": "this.newMail.references" }
}
```

Reply from the OWNER's connected mailbox (a mailbox template) to the mail that triggered the workflow; `this.mailbox`, `this.messageId`, `this.from` are body parameters bound from the connected-mailbox event:

```json
{
  "name": "replyFromOwnMailbox",
  "mailAccount": "workMail",
  "mailbox": { "js": "this.mailbox" },
  "to": { "js": "this.from.address" },
  "subject": { "js": "`Re: ${this.subject}`" },
  "body": { "js": "this.replyBody" },
  "inReplyTo": { "js": "this.messageId" }
}
```

Classic provider send with a rendered invoice attached:

```json
{
  "name": "sendConfirmation",
  "provider": "sendgrid",
  "subject": { "js": "`Order ${this.order.code} confirmed`" },
  "body": { "js": "this.emailBody" },
  "to": { "js": "this.user.email" },
  "attachments": { "js": "[this.invoicePdf]" }
}
```

## Errors

- Neither or both transports set: `MAIL_TRANSPORT_REQUIRED` / `MAIL_TRANSPORT_CONFLICT` at project validation.
- Unknown `provider` name: a runtime warning is logged and the action returns `false`; validation also cross-checks the name/kind (`UNKNOWN_NOTIFICATION_PROVIDER`, `INCOMPATIBLE_PROVIDER_KIND`).
- Unknown / send-disabled `mailAccount`: `UNKNOWN_MAIL_ACCOUNT` / `MAIL_ACCOUNT_SEND_DISABLED` at project validation; a reply through a `replyEnabled: false` account rejects at runtime with `MailBridgeError('MAIL_SEND_DISABLED')`.
- Provider send failure: `NotificationSendError` via `onActionError` (rethrow or `this.<actionName>Error`).
- A template mailbox the caller does not own: `MailBridgeError('MAILBOX_NOT_FOUND')` (404); a revoked owner token: `MAILBOX_INVALID` (409); an empty `mailbox` evaluation: `MAILBOX_REFERENCE_REQUIRED`.

## See also

- [`CheckMailboxAction`](./check-mailbox-action.md), [`ReadMailAction`](./read-mail-action.md): the pull/read half of the mail family.
- [`MailAccount`](../../spec/MailAccount.md): account pattern (autoListen, capability gates).
- [`SendSmsAction`](./send-sms-action.md), [`SendPushNotificationAction`](./send-push-notification-action.md), [`SendWhatsAppAction`](./send-whatsapp-action.md): sibling notification actions.
- [`RenderDataAction`](./render-data-action.md), [`RenderPdfAction`](./render-pdf-action.md): common producers of `body` and `attachments`.
- Email providers (SMTP, SendGrid, Amazon SES): [notification providers](../providers/notification.md).
