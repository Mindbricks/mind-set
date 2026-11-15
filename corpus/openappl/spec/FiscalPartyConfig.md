# FiscalPartyConfig

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [FiscalPartyConfig in Part 1](../ontology/FiscalPartyConfig.md)

Identity of one party (seller or buyer) on a fiscal document. Each of the three identity slots (tax id, legal name, address) binds EITHER a property of the owning DataObject (PropRefer — per-row identity) OR a static value (fixed identity); when both are set the property wins and the static value is the row-level fallback. The tax id is the load-bearing slot: it keys buyer-lookup routing and appears verbatim on the document; name and address are document content. Kept deliberately lean — structured address breakdowns, registration numbers and scheme ids are jurisdiction concerns the policy module derives, not blueprint fields.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `taxIdProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Property of the owning object holding the party's tax identifier (Turkey: VKN or TCKN). For the buyer this is the usual binding — every row carries its own counterparty. |
| `taxIdStaticValue` | `String` | no |  |  |  | Static tax identifier — the usual binding for the seller party, whose identity is fixed per project. Used when taxIdProperty is unset or resolves to nothing on the row. |
| `nameProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Property of the owning object holding the party's legal name. |
| `nameStaticValue` | `String` | no |  |  |  | Static legal name. Used when nameProperty is unset or resolves to nothing on the row. |
| `addressProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Property of the owning object holding the party's address as a single text value. |
| `addressStaticValue` | `String` | no |  |  |  | Static address text. Used when addressProperty is unset or resolves to nothing on the row. |

## Constraints

Property rules:

- `taxIdProperty`, `nameProperty`, `addressProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
