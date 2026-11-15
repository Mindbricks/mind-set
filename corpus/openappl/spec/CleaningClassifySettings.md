# CleaningClassifySettings

**Level:** `subsection` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [CleaningClassifySettings in Part 1](../ontology/CleaningClassifySettings.md)

A classify cleaning rule: judges the rule's `field` with a decision provider and writes a judged column plus `<targetColumn>Confidence` and `<targetColumn>DecidedBy` (the pinned model). It runs only in the Spark cleaning stage, never on the ingest path (DECISION_ON_INGEST_PATH). An `enumerable` source (the default) is lowered to a Spark broadcast join: the stage collects the DISTINCT values of the column, the service classifies that set once through the shared decision cache, and the value -> label map is broadcast and joined, so the number of decisions depends on the distinct values and never on the row count. A `freeText` source is checked against a design-time budget and is not generated yet (CLEANING_CLASSIFY_FREE_TEXT_NOT_IMPLEMENTED). When the stream has an analytics binding the judged columns land in its raw ClickHouse table too, so an AnalyticsRollup may group by `targetColumn`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `targetColumn` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The judged column this rule produces. It must not collide with an eventSchema field, another judged column or a companion; the rule also produces `<targetColumn>Confidence` (Double) and `<targetColumn>DecidedBy` (the model version). |
| `sourceKind` | `String` | no | `"enumerable"` |  |  | How the judged `field` is lowered: `enumerable` (default) classifies its distinct values once and broadcast-joins the labels; `freeText` would batch rows per partition and is budget-checked at design time but not generated yet. |
| `providerName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the `projectSettings.decisionProvidersSettings.decisionProviders[]` entry that judges the values. A dangling name fails validation (DECISION_PROVIDER_NOT_FOUND). |
| `model` | `String` | no |  |  |  | The PINNED model version sent by this classify rule, overriding the provider entry's pin. Null inherits the entry. The selected model separates cached labels, and `<targetColumn>DecidedBy` records the model that answered. Floating tags are refused (DECISION_MODEL_NOT_PINNED). |
| `question` | [`DecisionQuestion`](./DecisionQuestion.md) | yes |  |  |  | The ONE typed question asked about each value (a DecisionQuestion): `noul` stores the decision as a boolean, `choice` stores the option key and needs an escape option. `score` is refused (CLEANING_CLASSIFY_SCORE_UNSUPPORTED): a fractional level is not a stable label to group by. |
| `confidenceThreshold` | `Double` | no | `0.8` |  |  | Confidence at or above which an answer is stored as the label; below it the label stays null and only the confidence and model are recorded. Must sit outside the provider's drift band of 0.5 (DECISION_THRESHOLD_IN_DRIFT_BAND). |
| `maxDistinctValues` | `Integer` | no | `1000` |  |  | [enumerable] Ceiling on the distinct values one run classifies. Default 1000, framework ceiling 5000; a run whose source column has more fails closed with CLASSIFY_CARDINALITY_EXCEEDED before any decision is asked. |
| `declaredRecordsPerWindow` | `Integer` | no |  |  |  | [freeText] The record volume one cleaning window must judge. With `windowMinutes`, `maxRecordChars` and `requestsPerMinute` it drives the design-time budget check (CLEANING_CLASSIFY_BUDGET_EXCEEDED). |
| `windowMinutes` | `Integer` | no |  |  |  | [freeText] The minutes one cleaning window may spend judging `declaredRecordsPerWindow` records. |
| `maxRecordChars` | `Integer` | no | `1000` |  |  | [freeText] The longest judged text, in characters; it sizes how many records fit one request (the batch is token-derived, at ~3.5 characters per token). Default 1000. |
| `requestsPerMinute` | `Integer` | no | `30` |  |  | [freeText] The provider request rate the budget assumes. Default 30, a conservative declared figure: no rate wall was measured, so set it from throughput measured on your own account. |

## Constraints

Property rules:

- `targetColumn`, `providerName`, `question` must be present. (`REQUIRED_FIELD_MISSING`)
- `targetColumn`, `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
