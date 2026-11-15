# LedgerEntrySource

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerEntrySource in Part 1](../ontology/LedgerEntrySource.md)

Configures the source-reference column and optional owner/source uniqueness of credited lots. The coarse source-reference line on the LOTS: `referenceProperty` names a generated lot column storing the originating business ref of each credited lot, and with `unique: true` (the default) the framework adds a unique (owner, sourceRef) index — the optional COARSE second idempotency line behind the movement-level idempotencyKey (one credit per business source, e.g. one earn per order).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `referenceProperty` | `String` | no | `"sourceRef"` |  | format [codeName](./value-formats.md#codename) | Name of the generated lot column carrying the originating business reference. Default 'sourceRef'. |
| `unique` | `Boolean` | no | `true` |  |  | When true (the default), the framework adds a unique (owner, sourceRef) index on the lots — the same business source cannot credit the same owner twice. |
| `sourceTypeProperty` | `String` | no | `"sourceType"` |  | format [codeName](./value-formats.md#codename) | Optional name of a generated lot column carrying the source's type discriminator. Default 'sourceType'. |

## Constraints

Property rules:

- `referenceProperty`, `sourceTypeProperty` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
