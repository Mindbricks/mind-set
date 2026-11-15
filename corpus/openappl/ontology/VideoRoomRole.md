# VideoRoomRole

**Level:** `section` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoRoomRole in Part 2](../spec/VideoRoomRole.md)

Defines a named media-capability set for video room users. Each capability maps 1:1 onto a grant in the minted provider join token (e.g. LiveKit video grants) — the SFU enforces them, the service only declares them. Roles are assigned by authSources, authScripts, or absoluteRoles (which get a built-in full-capability 'system' role). Examples: a webinar 'speaker' (publish all), 'attendee' (subscribe + data channel), a broadcast 'presenter' vs 'viewer' (playback only).

## Contained in

- [VideoRoom](./VideoRoom.md) as `roomRoles` (a list)

Blueprint paths:

- `services.videoRooms.roomRoles`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
