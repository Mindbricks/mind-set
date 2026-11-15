# LedgerPartyRef

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerPartyRef in Part 1](../ontology/LedgerPartyRef.md)

Column names for one party side of a movement. Pure metadata: the ledger stores and returns these values but never resolves, validates, or joins them — no FK is created (declare a real relation under additionalProperties when referential integrity is wanted).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `idProperty` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Name of the generated column carrying the party's id value (metadata, not a relation). |
| `typeProperty` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Name of the generated column carrying the party's type discriminator (e.g. 'order', 'promotion', 'refund', 'payout'). |

## Constraints

Property rules:

- `idProperty`, `typeProperty` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
