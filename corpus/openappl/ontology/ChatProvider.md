# ChatProvider

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ChatProvider in Part 2](../spec/ChatProvider.md)

RETIRED (patterns 1.60.0) - a legacy chat bot, kept loadable for the on-load conversion only. A bot has no channel and holds no credential any more: a WhatsApp bot is converted to the `whatsappProvider` it named, a Telegram bot to the telegram notification provider whose `telegramBotToken` names the same env var as the bot's `botToken` (else to a generated telegram provider named after the bot, whose credentials the operator fills), and every surface or mcpbff exposure that referenced the bot is re-pointed to that provider. `botToken`, `verifyToken`, `appSecret`, `phoneNumberId` and `webhookPath` are dropped by the conversion (a Telegram `webhookPath` of an mcpbff bot moves to the mcpbff surface entry). Validation warns per converted bot (CHAT_BOT_CONVERTED); save the converted blueprint to silence it.

## Contained in

- [ChatProvidersSettings](./ChatProvidersSettings.md) as `chatProviders` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
