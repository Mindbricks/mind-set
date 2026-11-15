# CleaningRule

**Level:** `subsection` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [CleaningRule in Part 1](../ontology/CleaningRule.md)

**Name:** an instance is named by `name`.

[P5b, defined-but-deferred] One built-in cleanup rule lowered into the Spark ETL transform (see the family's design record, §4.1). Applied IN SPARK, never in the service. Schema-only in Phase 3.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Rule identifier. Must be a valid codeName. |
| `op` | `String` | no |  |  |  | The cleanup operation: `validate` \| `dedup` \| `normalize` \| `filter` \| `cast` \| `rename` \| `classify`. Kept as String in v1. `classify` judges `field` with a decision provider and needs the `classify` block. |
| `field` | `String` | no |  |  |  | The eventSchema field the rule operates on (for cast/rename/normalize/validate on a single column). |
| `expression` | [`MScript`](./MScript.md) | no |  |  | MScript kind `external` | An MScript-backed predicate (validate/filter) or expression (normalize/cast/rename) over the event schema, which codegen compiles into a Spark SQL / DataFrame op. |
| `classify` | [`CleaningClassifySettings`](./CleaningClassifySettings.md) | no |  |  |  | [op=classify] The judged-column declaration (CleaningClassifySettings): the target column, the decision provider and pinned model, the question, the threshold and the source kind. Null for every other op. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
