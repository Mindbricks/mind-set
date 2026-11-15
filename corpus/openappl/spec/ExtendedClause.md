# ExtendedClause

**Level:** `subsection` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [ExtendedClause in Part 1](../ontology/ExtendedClause.md)

**Name:** an instance is named by `name`.

Defines an optional filtering clause that is dynamically included in the query when a single MScript condition is met. Enables route-level filtering to adapt to session, context, or other logic at runtime.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | A descriptive label used for internal documentation or UI purposes. Does not impact runtime behavior. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript expression that gates whether `whereClause` is merged into the query at runtime. The clause applies when the expression evaluates truthy. Leave null to apply the clause unconditionally. To express an exclusion (apply when X is NOT true), negate the expression yourself, e.g. `{ "js": "!this.session?.isAdmin" }`. |
| `whereClause` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `mquery` | The conditional query fragment to include, written as an MScript Query. The clause is merged into the final query when `condition` is truthy (or when `condition` is null, in which case the clause always applies). |

## Constraints

Property rules:

- `name`, `whereClause` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
