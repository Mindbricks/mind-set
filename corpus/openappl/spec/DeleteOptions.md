# DeleteOptions

**Level:** `section` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [DeleteOptions in Part 1](../ontology/DeleteOptions.md)

Options block of a `delete`-type Business API. NOTE: it does NOT decide soft-vs-hard delete — that choice belongs to the data object (see `useSoftDelete` below).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useSoftDelete` | `Boolean` | no |  |  |  | OPTIONAL and INERT — no code generator reads this flag, and it is no longer a REQUIRED field. It was required-but-inert: every delete api had to carry a value whose only observable behaviour was raising DELETE_OPTIONS_SOFTDELETE_IGNORED when it disagreed with the data object, and a designer who trusted it hit the unique index at runtime. Whether a delete archives the row (sets `isActive: false`) or physically removes it is decided ONLY by the target data object's `objectSettings.basicSettings.useSoftDelete`, which defaults to true; there is no per-API override. Writing `useSoftDelete: false` here does NOT turn one delete API into a hard delete — the row is still archived — so validation reports it (DELETE_OPTIONS_SOFTDELETE_IGNORED, warning) when it contradicts the object flag. To hard-delete, set `useSoftDelete: false` on the data object itself, which applies to every API that deletes it. Omit this field unless you are deliberately restating the object's flag. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
