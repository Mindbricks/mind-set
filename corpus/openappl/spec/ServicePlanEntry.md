# ServicePlanEntry

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ServicePlanEntry in Part 1](../ontology/ServicePlanEntry.md)

**Name:** an instance is named by `serviceName`.

One service the project INTENDS to create, as named by the microservice-definition plan. An entry is a statement of intent, never evidence of existence: nothing in the framework may resolve, load, join to or emit against it, and codegen never reads it. Its only effect is on DESIGN-TIME validation — a cross-service reference whose target is named here is reported as a WARNING (planned, not created yet) instead of an ERROR, which is what makes a forward reference distinguishable from a typo. A reference to a service the plan does NOT name stays a hard error.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `serviceName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the planned service, exactly as it will be created. Matched case-insensitively against the project's real services[] entries; once that service exists the entry is inert. |
| `dataObjects` | `String`[] | no |  |  |  | Data objects the plan expects this service to hold. DOCUMENTATION ONLY — nothing validates, resolves or tiers on this list, so it may go stale without consequence. It exists so a human (and the diagram legend) can read what the planned service is for; keeping it in step with the real blueprint is explicitly NOT required. |

## Constraints

Property rules:

- `serviceName` must be present. (`REQUIRED_FIELD_MISSING`)
- `serviceName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
