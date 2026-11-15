# SettlementReleaseConfig

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [SettlementReleaseConfig in Part 1](../ontology/SettlementReleaseConfig.md)

When a providerSplit marketplace sale's seller share is released (MarketplaceConfig.settlementRelease). The framework books one payout row per captured sale (payment.captured) carrying the provider's settlement item ids of that sale, holds it until the condition below holds, and the payout-scheduler releases it exactly once (its claim / fence path), re-checking the condition on every tick. Bindings are PropRefers naming properties of the SAME data object that carries the marketplace block (the sale row read back from the database, never a request body). Composes with payoutGate: a gated release still waits for the matching inbound invoice.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mode` | `SettlementReleaseMode` | no |  | `onCapture`, `onDate`, `onStatus`, `manual` |  | Release trigger. `onCapture`: release as soon as the sale is captured (the next scheduler tick sends it). `onDate`: hold until now >= the sale row's releaseAtProperty (a Date); a row whose date is empty or unparseable stays held. `onStatus`: hold until the sale row's statusProperty reads one of releaseOnStatus. `manual`: hold until a payout is created for that sale (POST /v1/payments/payouts or a PayoutAction naming the sale by metadata.orderId / sourceOrderProperty), which releases the booked row instead of booking a second payout. Null is inert (no release machinery is emitted). |
| `releaseAtProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | (mode=onDate, REQUIRED) Property of this object holding the release date-time, e.g. the experience end. Read off the persisted sale row on every scheduler tick, so moving the date moves the release. |
| `statusProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | (mode=onStatus, REQUIRED) Property of this object holding the sale's business status (an Enum or String), e.g. the experience state. |
| `releaseOnStatus` | `String`[] | no |  |  |  | (mode=onStatus, REQUIRED) The status value(s) of statusProperty that release the share, compared exactly (case-sensitive) with the stored value. |

## Constraints

Property rules:

- `mode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `releaseAtProperty`, `statusProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
