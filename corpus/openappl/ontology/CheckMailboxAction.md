# CheckMailboxAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [CheckMailboxAction in Part 2](../spec/CheckMailboxAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Checks a MailAccount's mailbox on demand and stores the matching message summaries in the context. Summaries are the canonical mail envelope WITHOUT bodies or attachment content (`account`, `messageId`, `inReplyTo`, `references`, `from`, `to`, `cc`, `subject`, `attachments` metadata, `receivedAt`) — use `ReadMailAction` with a summary's `messageId` to fetch the full message. The mailbox is reached through the mcpbff mail bridge over signed M2M; the account's credentials never enter this service (docs/ADR-mail-account-family.md §4/§10). Complements the account's `autoListen` Kafka push: use this when a workflow needs to PULL from the mailbox at a specific moment (a cron sweep, an on-request inbox view) instead of reacting to the `new-email-arrived` topic.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `checkMailboxActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.checkMailboxActions`
- `services.businessLogic.actions.checkMailboxActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
