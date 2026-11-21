---
title: CheckMailboxAction
---

# CheckMailboxAction

`CheckMailboxAction` pulls filtered message summaries from a project [`MailAccount`](../../spec/MailAccount.md)'s mailbox on demand. Summaries are the canonical mail envelope **without bodies or attachment content**: metadata only. The mailbox is reached through the mcpbff mail bridge over signed M2M: the account's credentials exist only in the mcpbff deployable, and the calling service never opens an IMAP socket.

## When to use it

- A cron/workflow that **pulls** from a mailbox at a specific moment: a nightly sweep of unseen invoices, an on-request inbox view before assigning tickets.
- Complementing `autoListen`: the listener **pushes** every new mail onto the `new-email-arrived` Kafka topic; this action is the pull half for workflows that need "what's in the box right now, matching these filters".

To fetch a message's bodies and attachment bytes, follow up with [`ReadMailAction`](./read-mail-action.md) using a summary's `messageId`. To reply, use [`SendMailAction`](./send-mail-action.md) with `mailAccount` + `inReplyTo`.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `mailAccount` | `String` | yes | Codename of a `projectSettings.mailAccountsSettings.mailAccounts[]` entry. Unresolvable names are rejected at project validation (`UNKNOWN_MAIL_ACCOUNT`). A mailbox template (`ownerScope` `tenant` / `user`) may be named too, by a compiler that implements mailbox templates: `mailbox` then says which connected mailbox; a template without `mailbox` is refused (`MAIL_ACCOUNT_TEMPLATE_STATIC_REFERENCE`; from a compiler that does not implement templates, `MAIL_ACCOUNT_TEMPLATE_LANGUAGE_UNSUPPORTED`). |
| `mailbox` | `MScript` | template only | Template only: the ONE connected mailbox to check. Either the `mailbox` object of the connected-mailbox event that triggered the api (`this.mailbox` from a body parameter), or a string, the address of a mailbox the session owner connected to the template. The mcpbff admits the owner, a tenant admin of the owning tenant, or the event context acting for the owner; anyone else gets `MAILBOX_NOT_FOUND`. Refused on a project account (`MAIL_ACCOUNT_MAILBOX_ON_PROJECT`). See [Connected mailboxes](../capabilities/connected-mailboxes.md#using-a-connected-mailbox-from-the-backend). |
| `unseenOnly` | `MScript` | no | Boolean; default `true`: only messages without the `\Seen` flag. Set `false` to search the whole INBOX. |
| `since` | `MScript` | no | ISO-8601 date string or `Date`: messages the server received on/after it (IMAP `SINCE`, day granularity). |
| `from` | `MScript` | no | Case-insensitive substring match on the From header (e.g. `'@acme.com'`). |
| `subjectContains` | `MScript` | no | Case-insensitive substring match on the Subject header. |
| `limit` | `MScript` | no | Maximum summaries returned; the **newest** n matches are kept, returned oldest-first. Default 20, ceiling 100. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

The action builds the filter object from the evaluated MScripts and asks the mail bridge to check the account: a signed M2M `POST /bridge/mail/:account/check` on mcpbff. mcpbff opens a short-lived IMAP session (independent of the autoListen listener), runs a server-side `SEARCH`, and returns each hit as a summary:

```json
{
  "account": "support",
  "messageId": "<abc@ext.com>",
  "inReplyTo": null,
  "references": [],
  "from": { "name": "Jane Doe", "address": "jane@acme.com" },
  "to": [{ "name": null, "address": "support@ours.com" }],
  "cc": [],
  "subject": "Invoice overdue",
  "attachments": [{ "filename": "invoice.pdf", "mimeType": "application/pdf", "size": 182044 }],
  "receivedAt": "2026-07-08T09:15:00.000Z"
}
```

The result (an array) is stored under `contextPropertyName` (or the action name). Checking never changes mailbox state: the `\Seen` flag is untouched.

## Example

```json
{
  "name": "checkSupportInbox",
  "mailAccount": "support",
  "unseenOnly": { "js": "true" },
  "subjectContains": { "js": "'invoice'" },
  "limit": { "js": "20" },
  "contextPropertyName": "invoiceMails"
}
```

On a mailbox template the action calls the bridge's connected-mailbox check instead: the evaluated `mailbox` reference rides the body and the calling session's context (user, tenant, roles, event context) rides signed in the M2M token; the mcpbff checks that the caller owns the mailbox before it opens it.

## Errors

- `mailAccount` not declared: project validation fails with `UNKNOWN_MAIL_ACCOUNT`; a service built before the account was declared degrades to a logged warning and an empty list (`[]`).
- A template mailbox the caller does not own, or none of that key: `MailBridgeError('MAILBOX_NOT_FOUND')` (404; existence is never revealed); an owner mailbox whose token was revoked: `MAILBOX_INVALID` (409, the owner reconnects); a `mailbox` expression that evaluated to nothing: `MAILBOX_REFERENCE_REQUIRED` before any call.
- Account platform without a runtime (any platform other than `imapSmtp`, `gmail` and `microsoftGraph`): the bridge answers `501 MAIL_PLATFORM_UNSUPPORTED`; surfaced as a thrown `MailBridgeError` per `onActionError`.
- Missing runtime credentials for the account: `MAIL_ACCOUNT_MISCONFIGURED`.

## See also

- [`ReadMailAction`](./read-mail-action.md): fetch one full message (bodies + attachment bytes) by `messageId`.
- [`SendMailAction`](./send-mail-action.md): reply on behalf of the account with threading.
- [`MailAccount`](../../spec/MailAccount.md): the account pattern (autoListen, markAsSeen, capability gates).
