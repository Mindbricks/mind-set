# ChatPrompt

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatPrompt in Part 1](../ontology/ChatPrompt.md)

**Name:** an instance is named by `name`.

A push prompt of a channel provider: an EventNotification delivered by this provider whose rendered text becomes a message with choices. A tapped choice is answered by the `promptReply` handler that names this prompt, within `ttlHours`, once, and only by the chat that received the prompt (and, when the notification resolved a user, only by that user).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique prompt name within the provider, named by `match.prompt` of a `promptReply` handler. Must be a valid codeName. |
| `notification` | `String` | yes |  |  |  | The EventNotification (`notificationService.eventNotifications[].eventNotificationBasics.name`) whose message this prompt sends. Its jobType must be this provider's channel and it must be delivered by THIS provider, named explicitly or as the channel default (CHAT_HANDLER_PROMPT_NOTIFICATION_UNBOUND). On WhatsApp a notification that sends an approved template needs as many quick-reply buttons in that template as there are choices. |
| `choices` | [`ChatPromptChoice`](./ChatPromptChoice.md)[] | no |  |  |  | The choices, 1 to 10 with unique ids (CHAT_HANDLER_PROMPT_CHOICES_INVALID). WhatsApp shows 1-3 as reply buttons and 4-10 as a list. |
| `ttlHours` | `Integer` | no | `24` |  |  | How long a choice can be tapped, in hours, 1 to 168 (CHAT_HANDLER_PROMPT_TTL_INVALID). Default 24. A tap after expiry, a second tap, or a tap from another chat is refused with a reply and no API call. |
| `data` | [`ChatHandlerParameter`](./ChatHandlerParameter.md)[] | no |  |  |  | Data recorded with the prompt and read back by the reply handler as `prompt.data.<key>`; each value is a template over `event.<key>` (the notification's event record, for example `{{event.orderId}}`). Null = no data. |

## Constraints

Property rules:

- `name`, `notification` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `choices` must have distinct names (`id`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `data` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
