# VisitContextField

**Level:** `subsection` · **Family:** [BusinessApiBasics](../ontology/families.md#businessapibasics) (domain `BusinessApi`)

**Ontology:** [VisitContextField in Part 1](../ontology/VisitContextField.md)

**Name:** an instance is named by `name`.

One analytic dimension captured on a visit history row (visits ADR section 2.3): its name in the row's `context` JSON, and the MScript that computes it at visit time.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The key of this dimension in the history row's `context` JSON, e.g. `category`, `campaign`, `device`. |
| `from` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript evaluated at visit time over the api context (the request and the fetched object), e.g. `this.product.categoryId`. The value is frozen on the row. |

## Constraints

Property rules:

- `name`, `from` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
