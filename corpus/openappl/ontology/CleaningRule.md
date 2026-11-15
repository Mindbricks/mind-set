# CleaningRule

**Level:** `subsection` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [CleaningRule in Part 2](../spec/CleaningRule.md)

[P5b, defined-but-deferred] One built-in cleanup rule lowered into the Spark ETL transform (see the family's design record, §4.1). Applied IN SPARK, never in the service. Schema-only in Phase 3.

## Contained in

- [EtlPipelineBinding](./EtlPipelineBinding.md) as `rules` (a list)

## Contains

- `classify`: [CleaningClassifySettings](./CleaningClassifySettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
