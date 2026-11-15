# ReadMailAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [ReadMailAction in Part 2](../spec/ReadMailAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Fetches ONE full message from a MailAccount's mailbox by its RFC 5322 `messageId` — bodies (`text`/`html`) plus attachment content — and stores it in the context. This is the on-demand content path of the mail family (docs/ADR-mail-account-family.md §3): the `new-email-arrived` Kafka envelope and CheckMailboxAction summaries carry attachment METADATA only, and a consumer that needs the bytes reads them through this action. Attachment items arrive as `{ filename, mimeType, size, contentBase64 }`. The mailbox is reached through the mcpbff mail bridge over signed M2M; credentials never enter this service (§4/§10).

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `readMailActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.readMailActions`
- `services.businessLogic.actions.readMailActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
