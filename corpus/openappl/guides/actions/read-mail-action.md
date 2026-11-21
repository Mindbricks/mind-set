---
title: ReadMailAction
---

# ReadMailAction

`ReadMailAction` fetches **one full message**, `text`/`html` bodies plus attachment content, from a project [`MailAccount`](../../spec/MailAccount.md)'s mailbox by its RFC 5322 `messageId`. It is the on-demand content path of the mail family: the `new-email-arrived` Kafka envelope and [`CheckMailboxAction`](./check-mailbox-action.md) summaries carry attachment **metadata only**; when a workflow needs the bytes, it reads them here. Mailbox credentials stay in the platform's mail bridge; the call rides signed service-to-service authentication.

## When to use it

- Inside a mail-triggered workflow (Kafka controller on `new-email-arrived`) to load the triggering mail's bodies and attachments. The mail envelope is the Kafka request body, so declare a `messageId` request parameter (`httpLocation: "body"`) and read it as `this.messageId`.
- After a `CheckMailboxAction`, to open one of the returned summaries.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `mailAccount` | `String` | ✓ | Codename of a `projectSettings.mailAccountsSettings.mailAccounts[]` entry. Unresolvable names are rejected at project validation (`UNKNOWN_MAIL_ACCOUNT`). A mailbox template (`ownerScope` `tenant` / `user`) may be named too: `mailbox` then says which connected mailbox; a template without `mailbox` is refused (`MAIL_ACCOUNT_TEMPLATE_STATIC_REFERENCE`; a compiler that does not implement mailbox templates refuses it with `MAIL_ACCOUNT_TEMPLATE_LANGUAGE_UNSUPPORTED`). |
| `mailbox` | `MScript` | ◐ | Template only: the ONE connected mailbox to read from. The `mailbox` object of the connected-mailbox event that triggered the api (`this.mailbox` from a body parameter), or the address of a mailbox the session owner connected. Owner-checked by the mail bridge (`MAILBOX_NOT_FOUND` for anyone else); refused on a project account (`MAIL_ACCOUNT_MAILBOX_ON_PROJECT`). See [Connected mailboxes](../capabilities/connected-mailboxes.md#using-a-connected-mailbox-from-the-backend). |
| `messageId` | `MScript` | ✓ | The RFC 5322 Message-ID to fetch (angle brackets optional). An empty evaluation throws; an unknown id fails with `MESSAGE_NOT_FOUND`. |
| `markSeen` | `MScript` |   | Boolean; default **`false`**. On an `autoListen` account the `\Seen` flag is the listener's delivery cursor, marking an unpublished message seen would eat its Kafka delivery. Only set `true` on accounts you fully drain via pull. |
| `includeAttachments` | `MScript` |   | Boolean; default `true`. When `false`, bodies only, attachment items keep their metadata with `contentBase64: null`. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

The action asks the platform's mail bridge (a signed service-to-service call) to open a short-lived IMAP session, locate the message by Message-ID (exact match; substring collisions are verified away), and return:

```json
{
  "account": "invoices",
  "messageId": "<abc@ext.com>",
  "inReplyTo": null,
  "references": [],
  "from": { "name": "Jane Doe", "address": "jane@acme.com" },
  "to": [{ "name": null, "address": "invoices@ours.com" }],
  "cc": [],
  "subject": "Invoice overdue",
  "text": "…plain-text body…",
  "html": "<p>…</p>",
  "attachments": [
    { "filename": "invoice.pdf", "mimeType": "application/pdf", "size": 182044, "contentBase64": "JVBERi0xLjQ…" }
  ],
  "receivedAt": "2026-07-08T09:15:00.000Z"
}
```

Decode an attachment by base64-decoding `item.contentBase64`.

## Example

Receive → read → book: a Kafka-triggered workflow on `new-email-arrived` loads the invoice PDF out of the triggering mail. The API declares a `messageId` request parameter with `httpLocation: "body"`, which binds the `messageId` of the mail envelope the message carries:

```json
{
  "name": "readInvoiceMail",
  "mailAccount": "invoices",
  "messageId": { "js": "this.messageId" },
  "contextPropertyName": "fullMail"
}
```

A connected mailbox: the event of a mailbox template carries metadata only, so the body is read here. The api declares body parameters `mailbox` (Object) and `messageId` (String) and the action reads `this.mailbox`:

```json
{
  "name": "readTriggeringMail",
  "mailAccount": "workMail",
  "mailbox": { "js": "this.mailbox" },
  "messageId": { "js": "this.messageId" },
  "includeAttachments": { "js": "false" },
  "contextPropertyName": "fullMail"
}
```

The bridge call carries the mailbox reference in its body and the calling session's context in the signed service token, and the mail bridge opens the mailbox only for its owner (or the event context acting for the owner). The worked flow is in [Mail to tasks](../capabilities/mail-to-tasks.md).

## Errors

- Empty `messageId` evaluation, the action throws immediately (there is nothing to read).
- A template mailbox the caller does not own, `MAILBOX_NOT_FOUND` (404); a revoked owner token, `MAILBOX_INVALID` (409); an empty `mailbox` evaluation, `MAILBOX_REFERENCE_REQUIRED`.
- Unknown `messageId`, `MESSAGE_NOT_FOUND` per `onActionError`.
- `mailAccount` not declared, `UNKNOWN_MAIL_ACCOUNT` at project validation.
- `MAIL_PLATFORM_UNSUPPORTED` / `MAIL_ACCOUNT_MISCONFIGURED`, as on [`CheckMailboxAction`](./check-mailbox-action.md).

## See also

- [`CheckMailboxAction`](./check-mailbox-action.md): list summaries first.
- [`SendMailAction`](./send-mail-action.md): reply with `mailAccount` + `inReplyTo`.
- [`MailAccount`](../../spec/MailAccount.md): the account pattern.
