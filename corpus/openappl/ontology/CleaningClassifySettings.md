# CleaningClassifySettings

**Level:** `subsection` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [CleaningClassifySettings in Part 2](../spec/CleaningClassifySettings.md)

A classify cleaning rule: judges the rule's `field` with a decision provider and writes a judged column plus `<targetColumn>Confidence` and `<targetColumn>DecidedBy` (the pinned model). It runs only in the Spark cleaning stage, never on the ingest path (DECISION_ON_INGEST_PATH). An `enumerable` source (the default) is lowered to a Spark broadcast join: the stage collects the DISTINCT values of the column, the service classifies that set once through the shared decision cache, and the value -> label map is broadcast and joined, so the number of decisions depends on the distinct values and never on the row count. A `freeText` source is checked against a design-time budget and is not generated yet (CLEANING_CLASSIFY_FREE_TEXT_NOT_IMPLEMENTED). When the stream has an analytics binding the judged columns land in its raw ClickHouse table too, so an AnalyticsRollup may group by `targetColumn`.

## Contained in

- [CleaningRule](./CleaningRule.md) as `classify`

## Contains

- `question`: [DecisionQuestion](./DecisionQuestion.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
