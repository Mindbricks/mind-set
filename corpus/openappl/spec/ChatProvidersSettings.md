# ChatProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatProvidersSettings in Part 1](../ontology/ChatProvidersSettings.md)

RETIRED (patterns 1.60.0) - kept loadable so an older blueprint converts on load. Chat bots no longer exist: agents and the mcpbff bind directly to a channel provider (a WhatsApp or Telegram notification provider) that owns every credential of the channel. See ProjectSettings.chatProvidersSettings for the conversion rules.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `chatProviders` | [`ChatProvider`](./ChatProvider.md)[] | no |  |  |  | RETIRED. The legacy bot list; every entry is converted on load and the list is dropped from the saved blueprint. Add nothing here: bind an aiAgent surface or mcpbffSettings.chatSurfaces[] to a channel provider instead. |

## Constraints

Property rules:

- The items of `chatProviders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
