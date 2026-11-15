# HubAuthSource

**Level:** `subsection` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubAuthSource in Part 2](../spec/HubAuthSource.md)

A DataObject-based authorization source for hub room access. Queries Elasticsearch for a record in the specified DataObject where userField matches the authenticated user and roomField matches the target room. If a record is found (and the optional condition passes), the user is granted the specified hubRole. Sources are evaluated top-to-bottom; the first match wins.

## Contained in

- [HubRoomSettings](./HubRoomSettings.md) as `authSources` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

- `sourceObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `userField` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `sourceObject`)
- `roomField` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `sourceObject`)

## Referenced by

No property of another pattern names this pattern.
