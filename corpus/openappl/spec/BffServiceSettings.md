# BffServiceSettings

**Level:** `chapter` · **Family:** [BffServiceSettings](../ontology/families.md#bffservicesettings) (domain `BFFService`)

**Ontology:** [BffServiceSettings in Part 1](../ontology/BffServiceSettings.md)

Module-level settings chapter for the BFF service. Holds documentation (UX intent for MindUI) and any future BFF-wide settings.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `documentation` | [`ModuleDocumentation`](./ModuleDocumentation.md) | no |  |  |  | Module-level frontend UX prompt describing DataView page surfaces, density/cardinality, KPI tiles, rows and cross-view drill-downs. It does not change the BFF runtime shape. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
