# SendMailAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [SendMailAction in Part 2](../spec/SendMailAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Sends an email using a configured email provider — or, when `mailAccount` is set, ON BEHALF OF a project MailAccount through the mcpbff mail bridge (docs/ADR-mail-account-family.md). The subject, body, and recipient addresses are defined via MScript and can be dynamically constructed from context. With `inReplyTo`/`references` the send becomes a threaded reply that real mail clients keep inside the original conversation. This action is commonly used for transactional notifications, confirmations, alerts, and mailbox replies.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `sendMailActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.sendMailActions`
- `services.businessLogic.actions.sendMailActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
