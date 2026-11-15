# PayoutCadenceConfig

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [PayoutCadenceConfig in Part 2](../spec/PayoutCadenceConfig.md)

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

## Contained in

- [PaymentProvider](./PaymentProvider.md) as `payoutCadence`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
