# PaymentProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [PaymentProvidersSettings in Part 2](../spec/PaymentProvidersSettings.md)

Container for payment provider configurations — PSPs and merchant-of-record providers. Each entry is a named provider that can be referenced by DataObject `checkout` / `subscription` / `marketplace` opt-ins and by payment-related business-API actions. The generator emits PAYMENT_PROVIDER_<NAME>_* environment variables per provider so service code can construct an SDK client at runtime without revisiting the project config. Replaces the legacy `stripeSettings` (single managed Stripe key pair) with the same shape used by aiProvidersSettings / bucketProvidersSettings / notificationProvidersSettings — multiple entries can share the same provider type (e.g. one Stripe account for one-time charges + a second Stripe Connect account for marketplace payouts; or one Paddle store for subscriptions + one Stripe for one-time donations).

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `paymentProvidersSettings`

Blueprint paths:

- `projectSettings.paymentProvidersSettings`

## Contains

- `paymentProviders`: [PaymentProvider](./PaymentProvider.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
