# ChatProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ChatProvidersSettings in Part 2](../spec/ChatProvidersSettings.md)

RETIRED (patterns 1.60.0) - kept loadable so an older blueprint converts on load. Chat bots no longer exist: agents and the mcpbff bind directly to a channel provider (a WhatsApp or Telegram notification provider) that owns every credential of the channel. See ProjectSettings.chatProvidersSettings for the conversion rules.

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `chatProvidersSettings`

Blueprint paths:

- `projectSettings.chatProvidersSettings`

## Contains

- `chatProviders`: [ChatProvider](./ChatProvider.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
