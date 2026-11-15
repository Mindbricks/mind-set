# AiProviderResourceCredentialBudget

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [AiProviderResourceCredentialBudget in Part 1](../ontology/AiProviderResourceCredentialBudget.md)

The per-row spend limit of the resource level. Usage on a row's key is charged to the caller and to the row's own budget, never to the application owner's budgets.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `dailyCostCeilingUsd` | `Double` | no |  |  | min 0 | Maximum estimated spend in USD per row per UTC day on that row's key, priced from the same model price table as the agent cost ceilings; a positive number. Enforced per service replica, like every agent cost ceiling, before each call (see `budget`). Null = no ceiling. |

## Constraints

Property rules:

- `dailyCostCeilingUsd` must be at least 0. (`VALUE_OUT_OF_RANGE`)
