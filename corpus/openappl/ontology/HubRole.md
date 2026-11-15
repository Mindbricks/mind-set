# HubRole

**Level:** `section` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubRole in Part 2](../spec/HubRole.md)

Defines a named permission set for hub users. Each role controls what actions a user can perform within a room. Roles are assigned by authSources, authScripts, or absoluteRoles. A built-in 'system' role (all permissions true) is automatically used for absoluteRoles users. When globalModeration or the role's 'moderated' flag is true, messages require moderator approval before broadcast.

## Contained in

- [RealtimeHub](./RealtimeHub.md) as `hubRoles` (a list)

Blueprint paths:

- `services.realtimeHubs.hubRoles`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
