# HubCustomMessageType

**Level:** `subsection` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubCustomMessageType in Part 2](../spec/HubCustomMessageType.md)

Defines a custom (app-specific) message type for the hub. Custom message types extend the built-in types with designer-defined names and field schemas. Each custom type adds its name to the messageType enum in the generated DataObject. The content JSONB column stores the fields defined here, validated at runtime. Examples: 'chessMove' with from/to/piece fields, 'nudge' with animation field, 'bid' with amount/currency fields.

## Contained in

- [HubMessageSettings](./HubMessageSettings.md) as `customMessageTypes` (a list)

## Contains

- `fields`: [HubCustomField](./HubCustomField.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
