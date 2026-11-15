# ModuleDocumentation

**Level:** `section` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [ModuleDocumentation in Part 1](../ontology/ModuleDocumentation.md)

Holds the module-level frontendDocument UX prompt. Reused across auth / bff / notification modules for consistency. MindUI reads frontendDocument to generate page UX; the section exists so module-level primitives stay in proper sections rather than at module/chapter root.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `frontendDocument` | `Text` | no |  |  |  | Module-level UX prompt for MindUI. Describes intended page placement, navigation patterns, empty/error states, and any role-specific landing rules. Empty = MindUI works from technical schema alone. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
