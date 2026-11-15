# PaymentProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [PaymentProvidersSettings in Part 1](../ontology/PaymentProvidersSettings.md)

Container for payment provider configurations — PSPs and merchant-of-record providers. Each entry is a named provider that can be referenced by DataObject `checkout` / `subscription` / `marketplace` opt-ins and by payment-related business-API actions. The generator emits PAYMENT_PROVIDER_<NAME>_* environment variables per provider so service code can construct an SDK client at runtime without revisiting the project config. Replaces the legacy `stripeSettings` (single managed Stripe key pair) with the same shape used by aiProvidersSettings / bucketProvidersSettings / notificationProvidersSettings — multiple entries can share the same provider type (e.g. one Stripe account for one-time charges + a second Stripe Connect account for marketplace payouts; or one Paddle store for subscriptions + one Stripe for one-time donations).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `paymentProviders` | [`PaymentProvider`](./PaymentProvider.md)[] | no |  |  |  | List of configured payment providers. Add one entry per payment account / backend you want available. Multiple entries can share the same provider type (e.g. two Stripe accounts for test and live, or a primary Stripe + a marketplace-only Stripe Connect). |

## Constraints

Property rules:

- The items of `paymentProviders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
