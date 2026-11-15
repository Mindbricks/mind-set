# ChatHandlingSettings

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatHandlingSettings in Part 1](../ontology/ChatHandlingSettings.md)

Deterministic chat handlers and push prompts of one channel provider (`notificationProviders[].chatHandling`), matched in declared order before any AI agent bound to the provider. Each handler maps a command, a message type, a pattern or a prompt reply to an optional business API call and a reply template; the sender is resolved to a user through the same chat identity seam the agent surfaces use (a linked account, or the phone on WhatsApp with `identityStrategy: phone`). A sender with no linked account is refused unless the handler sets `allowAnonymous`. On a provider with no agent or mcpbff exposure (handler-only) the handler runtime also answers the account link commands (Telegram `/start <code>`, WhatsApp `link <code>`), an unknown `/command` with the help reply, and leaves other unmatched messages unanswered; on a provider with a conversational consumer those reach the consumer.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `identityStrategy` | `ChatSurfaceIdentityStrategy` | no | `"link"` | `link`, `phone` |  | How a sender is resolved to an application user before a handler runs: 'link' (default; an account linked with a link code only) or 'phone' (WhatsApp only: the channel-asserted phone is matched against an existing user and the link is written on first use). 'phone' on a Telegram provider is refused (CHAT_HANDLER_IDENTITY_STRATEGY_INVALID): Telegram does not assert a phone. |
| `helpText` | `Text` | no |  |  |  | The help reply's first lines, sent for an unknown `/command` and a bare `/start` on a handler-only provider. The reply continues with one line per command handler (`/command - description`). Null = the command lines only. |
| `handlers` | [`ChatHandler`](./ChatHandler.md)[] | no |  |  |  | The handlers, in MATCH ORDER: the first handler whose match fits an inbound message claims it, and a claimed message runs exactly one handler, at most once. Names are unique per provider (CHAT_HANDLER_NAME_DUPLICATE) and so are commands (CHAT_HANDLER_COMMAND_DUPLICATE). |
| `prompts` | [`ChatPrompt`](./ChatPrompt.md)[] | no |  |  |  | Push prompts of this provider: an EventNotification delivered by this provider whose message carries choices (WhatsApp reply buttons, a list, or the quick-reply buttons of an approved template; Telegram inline keyboard buttons). A tapped choice is answered by the `promptReply` handler that names the prompt (and the choice). Null = no prompts. |

## Constraints

Property rules:

- `identityStrategy` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `handlers` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `prompts` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
