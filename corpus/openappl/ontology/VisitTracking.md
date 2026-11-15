# VisitTracking

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [VisitTracking in Part 2](../spec/VisitTracking.md)

Object-level visit storage (docs/ADR-object-visits-pattern.md section 2.1): WHERE the visits of this object go. The history table `sys_<Obj>Visit` is an analytics fact table (visit id, object id, tenant, actor key, user and session, signal, status, api name, controller, list attribution, the frozen `context` fields, server timestamps); the counter and the per-actor state are projections of it. The api-level `visitSettings` decides which call records a visit. Tenant and actor are stamped from the session, never accepted from the client. History and actor-state rows are personal data. No authorization or filtering decision may read a visit (ADR hard rule 1).

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `visitTracking`

Blueprint paths:

- `authentication.dataObjects.objectSettings.visitTracking`
- `services.dataObjects.objectSettings.visitTracking`

## Contains

- `ownerReadMapping`: [DataMapItem](./DataMapItem.md), a list

## References

- `counterProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `uniqueCounterProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
