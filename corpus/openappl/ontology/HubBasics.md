# HubBasics

**Level:** `section` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubBasics in Part 2](../spec/HubBasics.md)

Core identity of the realtime hub. The name is used in the Socket.IO namespace path (`/<service>-api/hub/{name}`), kebab-cased as the REST endpoint prefix (`/{kebab-name}` under the service's `/<service>-api` route), and as the code identifier.

## Contained in

- [RealtimeHub](./RealtimeHub.md) as `hubBasics`

Blueprint paths:

- `services.realtimeHubs.hubBasics`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
