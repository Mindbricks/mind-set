# DecisionCapabilities

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [DecisionCapabilities in Part 1](../ontology/DecisionCapabilities.md)

Per-entry capability flags for a DecisionProvider — which question types the adapter behind this entry supports and the ceilings it enforces (mirrors PaymentCapabilities). Defaults are derived from the `provider` enum value when this block is omitted. A decision surface that asks a question type the entry doesn't advertise, or a choice question wider than maxChoiceOptions, is refused at design time with a validation ERROR; nothing throws at codegen. Set a flag to false to intentionally narrow an entry (e.g. disable score questions on an entry meant only for yes/no gating).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `supportsNoul` | `Boolean` | no |  |  |  | Adapter supports `noul` questions — the probability 0..1 that a statement holds about the state. All shipped brands support this by default. |
| `supportsChoice` | `Boolean` | no |  |  |  | Adapter supports `choice` questions — one key out of a criteria map, answered with the full probability distribution over the options. |
| `supportsScore` | `Boolean` | no |  |  |  | Adapter supports `score` questions — a (possibly fractional) position on 2..10 ordered levels. |
| `maxChoiceOptions` | `Integer` | no |  |  |  | Upper bound on the criteria map size of a single choice question (Jev: 255). A choice question with more options than this bound is a design-time validation error, not a runtime surprise. |
| `contextTokenCeiling` | `Integer` | no |  |  |  | Upper bound on state + ALL questions of one request, in tokens (Jev: 65536). |
| `singleQuestionTokenCeiling` | `Integer` | no |  |  |  | Upper bound on state + the single longest question of one request, in tokens (Jev: 32768). |
| `probabilityDriftBand` | `Double` | no |  |  |  | Half-width of the band within which this provider's PROBABILITY is not reproducible across identical requests. Measured for jev-1.13.0 (one noul, 0.03 spread) and per question type: six noul, six choice and six score questions, 12 identical requests each, held every discrete answer and drifted at worst 0.07 (noul probability), 0.10 (choice confidence) and 0.07 (score confidence). The types do not differ materially, so the band is one number per brand: 0.2 for typesafe, twice the worst spread of any type. A DecisionAction whose confidenceThreshold sits within this band of a decision boundary can flip between two runs of the SAME request, which is DECISION_MODEL_NOT_PINNED's failure arriving through the threshold instead of the model version - hence DECISION_THRESHOLD_IN_DRIFT_BAND. Defaults are derived from `provider` at codegen time; a designer should leave this null. Set it only from a measurement of the brand behind this entry. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
