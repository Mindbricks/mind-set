# HubCustomField

**Level:** `subsection` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubCustomField in Part 2](../spec/HubCustomField.md)

Defines a single field in a custom message type's content schema. Fields are stored inside the message's content JSONB column and validated before persistence and broadcast. For Enum types, provide comma-separated allowed values in enumValues.

## Contained in

- [HubCustomMessageType](./HubCustomMessageType.md) as `fields` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
