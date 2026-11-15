# CheckMailboxAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [CheckMailboxAction in Part 1](../ontology/CheckMailboxAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Checks a MailAccount's mailbox on demand and stores the matching message summaries in the context. Summaries are the canonical mail envelope WITHOUT bodies or attachment content (`account`, `messageId`, `inReplyTo`, `references`, `from`, `to`, `cc`, `subject`, `attachments` metadata, `receivedAt`) — use `ReadMailAction` with a summary's `messageId` to fetch the full message. The mailbox is reached through the mcpbff mail bridge over signed M2M; the account's credentials never enter this service (docs/ADR-mail-account-family.md §4/§10). Complements the account's `autoListen` Kafka push: use this when a workflow needs to PULL from the mailbox at a specific moment (a cron sweep, an on-request inbox view) instead of reacting to the `new-email-arrived` topic.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mailAccount` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Codename of a `projectSettings.mailAccountsSettings.mailAccounts[]` entry — the mailbox to check. An unresolvable name is rejected at project-validation time (`UNKNOWN_MAIL_ACCOUNT`). A mailbox TEMPLATE (ownerScope tenant or user) may be named too (nodejs): `mailbox` then says which connected mailbox. |
| `unseenOnly` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression evaluating to a boolean. When true (the default), only messages without the `\Seen` flag are returned — 'what's new since the mailbox was last touched'. Set to `false` to search the whole INBOX. |
| `mailbox` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression naming ONE connected mailbox when `mailAccount` is a mailbox TEMPLATE (ownerScope tenant or user); refused on a project account (MAIL_ACCOUNT_MAILBOX_ON_PROJECT) and required on a template (MAIL_ACCOUNT_TEMPLATE_STATIC_REFERENCE without it). It evaluates either to the `mailbox` object a connected-mailbox event carries (`{ credentialKey, ownerId, scope, tenantId }`, for example `this.mailbox` when the api declares a body parameter `mailbox`, or `this.request.event.data.mailbox`), or to a string, the mailbox key (its lowercase address) of a mailbox the SESSION owner connected to the template (the user for a user template, the session's tenant for a tenant template). The mcpbff admits the call only when the caller owns the mailbox: the session user for a user template; a tenantOwner / tenantAdmin of that tenant for a tenant template; or the event context of a Kafka-triggered run whose actor is the owner (the system session minted in the event's tenant, acting for the event's user). Any other caller gets MAILBOX_NOT_FOUND, whether the mailbox exists or not. nodejs, rust, dotnet and java; other languages refuse a template (MAIL_ACCOUNT_TEMPLATE_LANGUAGE_UNSUPPORTED). |
| `since` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression evaluating to an ISO-8601 date string or `Date` — only messages the server received on/after that date match (IMAP SINCE, day granularity). |
| `from` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression evaluating to a string matched against the From header (case-insensitive substring, e.g. `{ "js": "'@acme.com'" }`). |
| `subjectContains` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression evaluating to a string matched against the Subject header (case-insensitive substring). |
| `limit` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression evaluating to the maximum number of summaries to return. The NEWEST n matches are kept, returned oldest-first. Default 20, ceiling 100. |

## Constraints

Property rules:

- `mailAccount` must be present. (`REQUIRED_FIELD_MISSING`)
- `mailAccount` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

## Example

Use to pull filtered message summaries from a MailAccount's inbox inside a workflow — e.g. a nightly cron that sweeps unseen invoices, or an API that lists a support mailbox before assigning tickets.

```json
{
  "name": "checkSupportInbox",
  "description": "List today's unseen support mails about invoices.",
  "mailAccount": "support",
  "unseenOnly": { "js": "true" },
  "subjectContains": { "js": "'invoice'" },
  "limit": { "js": "20" }
}
```
