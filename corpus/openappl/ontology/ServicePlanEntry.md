# ServicePlanEntry

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ServicePlanEntry in Part 2](../spec/ServicePlanEntry.md)

One service the project INTENDS to create, as named by the microservice-definition plan. An entry is a statement of intent, never evidence of existence: nothing in the framework may resolve, load, join to or emit against it, and codegen never reads it. Its only effect is on DESIGN-TIME validation — a cross-service reference whose target is named here is reported as a WARNING (planned, not created yet) instead of an ERROR, which is what makes a forward reference distinguishable from a typo. A reference to a service the plan does NOT name stays a hard error.

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `servicePlan` (a list)

Blueprint paths:

- `projectSettings.servicePlan`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
