# McpbffSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [McpbffSettings in Part 2](../spec/McpbffSettings.md)

Settings of the mcpbff system service (the project's native full-API assistant host). `chatSurfaces[]` lists the messaging surfaces the assistant is reachable over: one entry per channel provider, the same ChatSurfaceSettings shape an aiAgent uses. A Telegram exposure is a webhook of the mcpbff (`/chat/<provider>/webhook` unless `webhookPath` overrides it) verified with the provider's `telegramWebhookSecret`; a WhatsApp exposure consumes the provider's inbound messages from the dispatcher topic `<codename>-whatsapp-inbound-message` (one consumer group per exposure). Replies use the provider's credentials only.

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `mcpbffSettings`

Blueprint paths:

- `projectSettings.mcpbffSettings`

## Contains

- `chatSurfaces`: [ChatSurfaceSettings](./ChatSurfaceSettings.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
