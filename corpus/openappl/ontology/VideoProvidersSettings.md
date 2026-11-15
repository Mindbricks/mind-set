# VideoProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [VideoProvidersSettings in Part 2](../spec/VideoProvidersSettings.md)

Container for video-conference / live-broadcast provider configurations (docs/ADR-video-conference-pattern-family.md §3). Each entry is a named media backend that a service `videoRooms[]` VideoRoom references by `roomBasics.providerName`. The generated service is the CONTROL PLANE only — it mints join tokens, drives the provider's room API, and receives webhooks; audio/video/RTMP/HLS media flows directly between clients and the provider's SFU/CDN, never through the service. The generator emits VIDEO_<NAME>_* environment variables per provider so service code can construct the provider client at runtime without revisiting the project config. Mirrors the bucketProvidersSettings / aiProvidersSettings shape — a named array; multiple entries can share the same provider brand (e.g. one LiveKit cluster for meetings and one AWS IVS account for broadcasts).

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `videoProvidersSettings`

Blueprint paths:

- `projectSettings.videoProvidersSettings`

## Contains

- `videoProviders`: [VideoProvider](./VideoProvider.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
