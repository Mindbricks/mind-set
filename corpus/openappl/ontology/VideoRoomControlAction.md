# VideoRoomControlAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [VideoRoomControlAction in Part 2](../spec/VideoRoomControlAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Performs a provider control-plane operation on a declared VideoRoom. BusinessApiAction that performs a control-plane operation against a declared VideoRoom through its provider's server API: create or end a room session, remove/mute a participant, start/stop recording, start/stop broadcast outputs. The media itself never passes through the service — this action only drives the provider. Writes the provider response (e.g. session info, egress id) to the action context.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `videoRoomControlActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.videoRoomControlActions`
- `services.businessLogic.actions.videoRoomControlActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
