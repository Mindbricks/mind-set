# ChatHandlingSettings

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ChatHandlingSettings in Part 2](../spec/ChatHandlingSettings.md)

Deterministic chat handlers and push prompts of one channel provider (`notificationProviders[].chatHandling`), matched in declared order before any AI agent bound to the provider. Each handler maps a command, a message type, a pattern or a prompt reply to an optional business API call and a reply template; the sender is resolved to a user through the same chat identity seam the agent surfaces use (a linked account, or the phone on WhatsApp with `identityStrategy: phone`). A sender with no linked account is refused unless the handler sets `allowAnonymous`. On a provider with no agent or mcpbff exposure (handler-only) the handler runtime also answers the account link commands (Telegram `/start <code>`, WhatsApp `link <code>`), an unknown `/command` with the help reply, and leaves other unmatched messages unanswered; on a provider with a conversational consumer those reach the consumer.

## Contained in

- [NotificationProvider](./NotificationProvider.md) as `chatHandling`

## Contains

- `handlers`: [ChatHandler](./ChatHandler.md), a list
- `prompts`: [ChatPrompt](./ChatPrompt.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
