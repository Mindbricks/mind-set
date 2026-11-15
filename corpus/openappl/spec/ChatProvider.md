# ChatProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatProvider in Part 1](../ontology/ChatProvider.md)

**Name:** an instance is named by `name`.

RETIRED (patterns 1.60.0) - a legacy chat bot, kept loadable for the on-load conversion only. A bot has no channel and holds no credential any more: a WhatsApp bot is converted to the `whatsappProvider` it named, a Telegram bot to the telegram notification provider whose `telegramBotToken` names the same env var as the bot's `botToken` (else to a generated telegram provider named after the bot, whose credentials the operator fills), and every surface or mcpbff exposure that referenced the bot is re-pointed to that provider. `botToken`, `verifyToken`, `appSecret`, `phoneNumberId` and `webhookPath` are dropped by the conversion (a Telegram `webhookPath` of an mcpbff bot moves to the mcpbff surface entry). Validation warns per converted bot (CHAT_BOT_CONVERTED); save the converted blueprint to silence it.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | RETIRED. The legacy bot name; after the conversion the provider name is the binding key. |
| `surface` | `ChatSurfaceType` | no | `"telegram"` | `telegram`, `whatsapp` |  | RETIRED. The legacy bot channel; the surface type now comes from the bound provider's kind. |
| `webhookPath` | `String` | no |  |  |  | RETIRED. Moves to the mcpbff surface entry (`mcpbffSettings.chatSurfaces[].webhookPath`) for a converted Telegram bot that was exposed in mcpbff; dropped otherwise. |
| `botToken` | `String` | no |  |  |  | RETIRED. Dropped by the conversion: the bound provider's `telegramBotToken` / `whatsappAccessToken` is the outbound credential (env NOTIFICATION_PROVIDER_<PROVIDER>_<key>). For a Telegram bot, a telegram provider whose `telegramBotToken` names this env var is matched; otherwise a provider is generated. |
| `verifyToken` | `String` | no |  |  |  | RETIRED. Dropped by the conversion: the Telegram webhook secret is the bound provider's `telegramWebhookSecret`. |
| `appSecret` | `String` | no |  |  |  | RETIRED. Dropped by the conversion: the Meta app secret lives only on the WhatsApp provider (`whatsappAppSecret`). |
| `phoneNumberId` | `String` | no |  |  |  | RETIRED. Dropped by the conversion: the phone number id is the WhatsApp provider's `whatsappPhoneNumberId`. |
| `whatsappProvider` | `String` | no |  |  |  | RETIRED. The conversion target of a WhatsApp bot: the surfaces that referenced the bot are re-pointed to this provider. |
| `exposeInMcpbff` | `Boolean` | no | `false` |  |  | RETIRED. A bot exposed in mcpbff is converted to an `mcpbffSettings.chatSurfaces[]` entry naming the provider. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `surface` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
