# EventSubAuth

**Level:** `section` · **Family:** [EventSubscription](./families.md#eventsubscription) (domain `Service`)

**Specification:** [EventSubAuth in Part 2](../spec/EventSubAuth.md)

Authorization configuration for this event subscription. Default auth derives from each topic's DataObject access level -- public topics are open, protected topics require authentication (+ tenant filtering in multi-tenant), private topics require ownership (or admin role if no ownership field exists). The designer can add absoluteRoles to bypass all checks, checkRoles to gate access, and custom MScript auth/filter logic.

## Contained in

- [EventSubscription](./EventSubscription.md) as `auth`

Blueprint paths:

- `services.eventSubscriptions.auth`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
