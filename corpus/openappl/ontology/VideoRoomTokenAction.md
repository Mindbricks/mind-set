# VideoRoomTokenAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [VideoRoomTokenAction in Part 2](../spec/VideoRoomTokenAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Authorizes a room identity and mints its provider join token or broadcast playback grant. BusinessApiAction that runs a declared VideoRoom's authorization flow for a room record + identity and mints the provider join credential — an SFU join token carrying the resolved roomRole's media grants, or an HLS playback grant for subscribe-only access to a broadcast room. Writes `{ token, url, roomRole }` to the action context. Use inside composed workflows (e.g. mint a token at the end of a paid-ticket checkout API); simple cases use the room's auto token route instead (codegen phase).

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `videoRoomTokenActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.videoRoomTokenActions`
- `services.businessLogic.actions.videoRoomTokenActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
