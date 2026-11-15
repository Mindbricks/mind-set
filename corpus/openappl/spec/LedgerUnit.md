# LedgerUnit

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerUnit in Part 1](../ontology/LedgerUnit.md)

The ledger's unit of account. `name` labels the unit (points, credits, cents, stock units); amounts are integers at a fixed-point scale. EXACTLY ONE of `scale` or `scaleProperty` must be declared (validator-enforced): `scale` is a single global scale for the whole ledger; `scaleProperty` names an owner-row column carrying the per-asset scale — the multi-asset divider form, where the scale is seeded from an app-declared asset catalog (BTC rows carry 100000000, USD rows carry 100).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | Name of the unit of account (e.g. 'points', 'credits', 'cents'). Used in documentation, events, and generated API docs. |
| `scale` | `Integer` | no |  |  |  | Global fixed-point scale for the whole ledger — the integer amounts stored are `real value × scale` (100 = two decimal places; 1 = whole units). Declare exactly one of scale \| scaleProperty. |
| `scaleProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Owner-row column (PropRefer into the decorated object) carrying the per-asset fixed-point scale, for multi-asset dividers where each owner row is one asset. Declare exactly one of scale \| scaleProperty. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `scaleProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
