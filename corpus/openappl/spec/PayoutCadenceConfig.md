# PayoutCadenceConfig

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [PayoutCadenceConfig in Part 1](../ontology/PayoutCadenceConfig.md)

Per-provider payout scheduling + reserve configuration. Attached to a PaymentProvider when the provider supports marketplace. The codegen-emitted PayoutManager branches on `mode`: on_demand → synchronous provider call; scheduled → row inserted into sys_<X>Payout with status='scheduled' for the payout-scheduler cron to pick up; provider_driven → throws PaymentGateError(409) and the panel UI greys out the create button.

`reserveDays` is a hold on each payout: when the PayoutManager books a sys_<X>Payout row it stamps availableForPayoutAt = max(scheduledFor, createdAt + reserveDays), and the payout-scheduler never sends the row before that time. With reserveDays > 0 an on_demand create is booked for the scheduler instead of paid synchronously. The window runs from the payout's creation; it is not yet tied to the capture of the specific payments the payout pays out.

Per-provider defaults. These are the EFFECTIVE defaults, not documentation: leave `mode` null and this table decides — the validator, the pattern instance and every PayoutManager template all read it, so the generated code runs the cadence the provider actually does. An authored `mode` overrides it.
- stripe: mode='provider_driven' (Stripe Connect controls), reserveDays=0
- paypal: mode='on_demand', reserveDays=0
- iyzico: mode='provider_driven' (daily/weekly settlement), reserveDays=0
- adyen: mode='provider_driven' (Adyen surfaces reserve in webhook), reserveDays=varies
- paddle: mode='on_demand', reserveDays=0
- lemonsqueezy: mode='on_demand', reserveDays=0
- mangopay: mode='on_demand', reserveDays=0
- custom: mode='on_demand', reserveDays=0

An entry with no `provider` is read as stripe (the same default `indexPaymentProviders` and the templates apply); a provider type with no row here falls back to the `custom` row.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mode` | `PayoutCadenceMode` | no |  | `on_demand`, `scheduled`, `provider_driven` |  | How payouts are scheduled. on_demand = framework-driven synchronous call; scheduled = framework-driven cron; provider_driven = provider owns the cadence. Leave null to take the PER-PROVIDER default (stripe/iyzico/adyen → provider_driven, paypal/paddle/lemonsqueezy/mangopay/custom → on_demand); set it to override that default. There is deliberately NO schema-level default here: a single global one would be wrong for the three providers that run their own settlement, and because a schema default is WRITTEN into the blueprint at validation time it would silently make the per-provider table dead for exactly those providers. |
| `schedule` | `PayoutSchedule` | no |  | `daily`, `weekly`, `monthly` |  | (mode='scheduled' only) Cadence — daily / weekly / monthly. Required when mode='scheduled'; ignored otherwise. |
| `reserveDays` | `Integer` | no | `0` |  |  | Number of days a payout is held before it may be sent. 0 = no hold. Each booked sys_<X>Payout row is stamped availableForPayoutAt = max(scheduledFor, createdAt + reserveDays) and the payout-scheduler does not send it earlier; with reserveDays > 0 an on_demand create is booked for the scheduler rather than paid synchronously. The window counts from the payout's creation, not from the capture of the funds it pays out. A provider_driven cadence (the stripe / iyzico / adyen default when mode is not set) books no payout, so nothing applies the reserve there: a PayoutAction on a marketplace owner bound to such a provider with reserveDays > 0 is a validation ERROR (PAYOUT_ACTION_PROVIDER_DRIVEN_RESERVE_OR_GATE) - set mode to scheduled (or on_demand) or keep reserveDays at 0. |

## Constraints

Property rules:

- `mode`, `schedule` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
