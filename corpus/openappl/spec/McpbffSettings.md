# McpbffSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [McpbffSettings in Part 1](../ontology/McpbffSettings.md)

Settings of the mcpbff system service (the project's native full-API assistant host). `chatSurfaces[]` lists the messaging surfaces the assistant is reachable over: one entry per channel provider, the same ChatSurfaceSettings shape an aiAgent uses. A Telegram exposure is a webhook of the mcpbff (`/chat/<provider>/webhook` unless `webhookPath` overrides it) verified with the provider's `telegramWebhookSecret`; a WhatsApp exposure consumes the provider's inbound messages from the dispatcher topic `<codename>-whatsapp-inbound-message` (one consumer group per exposure). Replies use the provider's credentials only.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `chatSurfaces` | [`ChatSurfaceSettings`](./ChatSurfaceSettings.md)[] | no |  |  |  | The messaging surfaces of the mcpbff full-API assistant. Each entry names a channel provider (kind whatsapp or telegram) and carries its identity strategy and, for Telegram, an optional webhook path. A provider may back at most one conversational consumer project-wide. Each surface may set typingIndicator false to disable read/typing signals; default on sends WhatsApp read plus typing every 20 seconds or Telegram typing every 4 seconds while its turn runs. Provider credentials only; status failures never fail the turn. |

## Constraints

Property rules:

- The items of `chatSurfaces` must have distinct names (`provider`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
