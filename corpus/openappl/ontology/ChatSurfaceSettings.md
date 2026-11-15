# ChatSurfaceSettings

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ChatSurfaceSettings in Part 2](../spec/ChatSurfaceSettings.md)

Binds a chat consumer (an aiAgent, or the mcpbff assistant through `mcpbffSettings.chatSurfaces[]`) to one messaging surface by naming a CHANNEL PROVIDER. The provider (`projectSettings.notificationProvidersSettings.notificationProviders[]`, kind `whatsapp` with provider `whatsapp`, or kind `telegram`) supplies the surface type and ALL credentials (WhatsApp: whatsappAccessToken / whatsappPhoneNumberId / whatsappApiVersion / whatsappApiBase / whatsappAppSecret / whatsappVerifyToken; Telegram: telegramBotToken / telegramWebhookSecret), read at runtime from NOTIFICATION_PROVIDER_<PROVIDER>_<key>; this entry only carries the surface-specific binding - the identity strategy, an optional Telegram webhook-path override and the typingIndicator activity preference (default on). Outbound replies are sent with the provider's credentials only; a WhatsApp reply posts through the provider's Graph API version (the adapter default v20.0 when unset). The retired `chatProvider` (a chat-bot name) is converted on load.

## Contained in

- [AgentEndpointSettings](./AgentEndpointSettings.md) as `chatSurfaces` (a list)
- [McpbffSettings](./McpbffSettings.md) as `chatSurfaces` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
