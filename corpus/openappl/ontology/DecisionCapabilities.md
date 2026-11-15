# DecisionCapabilities

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [DecisionCapabilities in Part 2](../spec/DecisionCapabilities.md)

Per-entry capability flags for a DecisionProvider — which question types the adapter behind this entry supports and the ceilings it enforces (mirrors PaymentCapabilities). Defaults are derived from the `provider` enum value when this block is omitted. A decision surface that asks a question type the entry doesn't advertise, or a choice question wider than maxChoiceOptions, is refused at design time with a validation ERROR; nothing throws at codegen. Set a flag to false to intentionally narrow an entry (e.g. disable score questions on an entry meant only for yes/no gating).

## Contained in

- [DecisionProvider](./DecisionProvider.md) as `capabilities`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
