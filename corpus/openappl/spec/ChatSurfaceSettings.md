# ChatSurfaceSettings

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatSurfaceSettings in Part 1](../ontology/ChatSurfaceSettings.md)

**Name:** an instance is named by `provider`.

Binds a chat consumer (an aiAgent, or the mcpbff assistant through `mcpbffSettings.chatSurfaces[]`) to one messaging surface by naming a CHANNEL PROVIDER. The provider (`projectSettings.notificationProvidersSettings.notificationProviders[]`, kind `whatsapp` with provider `whatsapp`, or kind `telegram`) supplies the surface type and ALL credentials (WhatsApp: whatsappAccessToken / whatsappPhoneNumberId / whatsappApiVersion / whatsappApiBase / whatsappAppSecret / whatsappVerifyToken; Telegram: telegramBotToken / telegramWebhookSecret), read at runtime from NOTIFICATION_PROVIDER_<PROVIDER>_<key>; this entry only carries the surface-specific binding - the identity strategy, an optional Telegram webhook-path override and the typingIndicator activity preference (default on). Outbound replies are sent with the provider's credentials only; a WhatsApp reply posts through the provider's Graph API version (the adapter default v20.0 when unset). The retired `chatProvider` (a chat-bot name) is converted on load.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | yes |  |  |  | Name of the channel provider this surface binds to - must match a `projectSettings.notificationProvidersSettings.notificationProviders[].name` whose kind is `whatsapp` (provider `whatsapp`, Meta Cloud) or `telegram`. The provider's kind IS the surface type and its configuration holds every credential. Also the asset identifier within the chatSurfaces list. Validation: a missing or unknown provider, or one of another kind, is an error (CHAT_SURFACE_PROVIDER_UNBOUND); a provider bound by two conversational consumers (two agent surfaces, or an agent surface and an mcpbff exposure) is an error (CHAT_PROVIDER_MULTI_CONSUMER). |
| `chatProvider` | `String` | no |  |  |  | RETIRED (patterns 1.60.0). The legacy chat-bot name. A surface still carrying it is converted on load: the bot's provider becomes `provider` and this field is dropped. Leave it null. |
| `webhookPath` | `String` | no |  |  |  | TELEGRAM only — optional override of the webhook path the provider calls to deliver inbound messages. Default: a per-consumer distinct path, /agents/{agent}/telegram/webhook for an aiAgent surface and /chat/{provider}/webhook for an mcpbff exposure (so several Telegram surfaces on one service never collide). The path serves POST only (inbound receive); Telegram has no GET verification handshake, and the secret token header is checked on each POST. A WhatsApp surface has NO webhook of its own: Meta calls the WhatsApp provider's one door `/v1/whatsapp-webhooks/meta/<providerName>` on the notification service and the agent consumes the provider's inbound messages over Kafka; a value set here for a whatsapp surface is ignored (the validator warns). |
| `identityStrategy` | `ChatSurfaceIdentityStrategy` | no | `"link"` | `link`, `phone` |  | How inbound senders are resolved to an application user: 'link' (explicit link-code only) or 'phone' (auto-bind via the channel-asserted phone). Defaults to 'link' on EVERY surface, WhatsApp included — phone auto-bind is an explicit opt-in, which is what the agent-hub prompt doc promises. The per-surface fallback some generators still carry (telegram → 'link', whatsapp → 'phone') is therefore unreachable from a hydrated ChatSurfaceSettings, and now also unreachable for a present-but-null key (the validator writes the declared default back into the raw config); it survives only where a generator reads a RAW blueprint whose key is OMITTED entirely. Removing that dead fallback is tracked as follow-up work. |
| `typingIndicator` | `Boolean` | no | `true` |  |  | Show best-effort activity while the agent or MCP BFF assistant runs. Enabled by default (including null/unset); false disables it. WhatsApp marks the inbound message id read and requests typing_indicator type text, refreshing every 20 seconds; Telegram sends sendChatAction typing every 4 seconds. Both use only the channel provider credentials and stop refreshing on reply or failure. Status-call errors are logged safely and never delay or fail the turn. WhatsApp dismisses its indicator on reply or after approximately 25 seconds. |

## Constraints

Property rules:

- `provider` must be present. (`REQUIRED_FIELD_MISSING`)
- `identityStrategy` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
