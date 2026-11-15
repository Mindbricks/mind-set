# VideoRoomAuthScript

**Level:** `subsection` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoRoomAuthScript in Part 2](../spec/VideoRoomAuthScript.md)

An MScript-based authorization source for video room access, evaluated with 'user' (session data) and 'room' (room record) as context variables. If the script returns true, the user is granted the specified roomRole. Scripts are evaluated after authSources, top-to-bottom; the first match wins. Mirrors HubAuthScript.

## Contained in

- [VideoRoomSettings](./VideoRoomSettings.md) as `authScripts` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
