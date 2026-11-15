# HubAuthScript

**Level:** `subsection` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubAuthScript in Part 2](../spec/HubAuthScript.md)

An MScript-based authorization source for hub room access. The script is evaluated with 'user' (session data) and 'room' (room record from Elasticsearch) as context variables. Scripts can call library functions for complex logic. If the script returns true, the user is granted the specified hubRole. Scripts are evaluated after authSources, top-to-bottom; the first match wins.

## Contained in

- [HubRoomSettings](./HubRoomSettings.md) as `authScripts` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
