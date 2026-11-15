# VideoRoomBroadcastSettings

**Level:** `section` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoRoomBroadcastSettings in Part 2](../spec/VideoRoomBroadcastSettings.md)

Live-broadcast delivery for webinar and broadcast room kinds. Configures the HLS output viewers play, the DVR window, RTMP ingest for external encoders (OBS/vMix) as publishers, the latency mode, and simulcast push targets — external RTMP endpoints (YouTube Live, Twitch, LinkedIn Live) the provider egress pushes the program feed to in parallel. Broadcast viewers authorize through the SAME roomSettings flow but receive an HLS playback grant instead of an SFU join token.

## Contained in

- [VideoRoom](./VideoRoom.md) as `broadcastSettings`

Blueprint paths:

- `services.videoRooms.broadcastSettings`

## Contains

- `simulcastTargets`: [VideoSimulcastTarget](./VideoSimulcastTarget.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
