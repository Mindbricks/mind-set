# PropertyDecisionSource

**Level:** `section` · **Family:** [DataProperty](./families.md#dataproperty) (domain `DataObject`)

**Specification:** [PropertyDecisionSource in Part 2](../spec/PropertyDecisionSource.md)

Write-time classification of one DataProperty by a decision provider. The decision is taken once, when the row is written, and stored as a derived column plus three companion columns (`<prop>DecisionConfidence`, `<prop>DecidedBy`, `<prop>DecidedAt`), so reads never consult the model. A stored judgement without its model version cannot be audited or re-derived when the criterion changes, which is why the companions are not optional. Lifecycle: a create decides (unless the caller supplied the value, which pins it as a manual override); an update re-decides only when it writes a `recomputeOn` property (or releases the override by writing `<prop>DecisionOverridden: false`); an update that writes the property itself pins it (`<prop>DecisionOverridden: true`, `<prop>DecidedBy: manual`) and later recompute triggers leave it alone. An answer whose confidence is below `confidenceThreshold` (and a noul whose probability sits inside the provider's drift band of 0.5) is NOT stored as a value: the column stays null while the confidence, model and time are recorded, so a boundary case is never silently classified (ADR rule 8). A provider failure never fails the write: the column and its companions are left unset and the backfill retries the row. The backfill is an in-process sweep of the service (the invoice-status poll precedent) that asks about a token-sized batch of rows (at most `backfillBatchSize`) in ONE request, addressing each row by its id, paced at `backfillRequestsPerMinute`.

## Contained in

- [DataProperty](./DataProperty.md) as `decisionSource`

Blueprint paths:

- `authentication.userProperties.decisionSource`
- `authentication.tenantProperties.decisionSource`
- `authentication.dataObjects.properties.decisionSource`
- `services.dataObjects.properties.decisionSource`

## Contains

- `question`: [DecisionQuestion](./DecisionQuestion.md)

## References

- `recomputeOn` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md))

## Referenced by

No property of another pattern names this pattern.
