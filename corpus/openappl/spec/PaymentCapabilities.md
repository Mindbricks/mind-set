# PaymentCapabilities

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [PaymentCapabilities in Part 1](../ontology/PaymentCapabilities.md)

Per-entry capability flags for a PaymentProvider. Each flag advertises what the underlying provider can do behind this named entry; the framework gates calls accordingly (e.g. a SubscriptionAction bound to a provider with supportsSubscriptions=false is refused at design time with validation ERROR INCOMPATIBLE_PAYMENT_PROVIDER_CAPABILITY, and the runtime adapter throws CapabilityLimitedError on any call that slips through; nothing throws at codegen). Defaults are derived from the `provider` enum value when this block is omitted. Set a flag to false to intentionally narrow capabilities — e.g. disable subscriptions on a Stripe entry used only for one-time donations, or disable marketplace on a Stripe account that is not a Connect account.

### Per-provider capability defaults

The defaults below apply when the `capabilities` block is omitted; an explicit entry is shallow-merged over them. A false default means the adapter does not implement the capability — an entry cannot enable it, only narrow a true one.

| Capability | stripe | paypal | iyzico | adyen | paddle | lemonsqueezy | mangopay | custom |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `supportsOneTime` | true | true | true | true | true | true | true | true |
| `supportsRefundsFull` | true | true | true | true | true | true | true | false |
| `supportsRefundsPartial` | true | true | true | true | true | true | true | false |
| `supportsSubscriptions` | true | true | true | true | true | true | false | false |
| `supportsProration` | true | false | false | true | true | true | false | false |
| `supportsMarketplace` | true | true | true | true | false | false | true | false |
| `supportsConnectedKYC` | true | true | false | true | false | false | true | false |
| `supportsDisputes` | true | true | true | true | true | false | true | false |
| `supportsSavedCards` | true | true | true | true | true | true | true | false |
| `supportsApplePayGooglePay` | true | true | false | true | true | true | false | false |
| `supports3DSecure` | true | true | true | true | true | true | true | false |
| `isMerchantOfRecord` | false | false | false | false | true | true | false | false |
| default KYC mode | `hosted-url` | `partner-referrals` | `hosted-stepwise` | `hosted-stepwise` | `none` | `none` | `document-api` | `none` |
| default payout cadence | `provider_driven` | `on_demand` | `provider_driven` | `provider_driven` | `on_demand` | `on_demand` | `on_demand` | `on_demand` |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `supportsOneTime` | `Boolean` | no |  |  |  | Provider can charge a single payment (createPaymentIntent + capture). All providers in the enum support this by default. |
| `supportsRefundsFull` | `Boolean` | no |  |  |  | Provider supports full refunds of a captured payment. |
| `supportsRefundsPartial` | `Boolean` | no |  |  |  | Provider supports partial refunds. When false but supportsRefundsFull=true, refund requests must omit `amount` (full-only). |
| `supportsSubscriptions` | `Boolean` | no |  |  |  | Provider supports recurring subscriptions (plans, renewals, cancellations). Set false on a provider that natively supports subscriptions if this entry is intentionally one-time-only. |
| `supportsProration` | `Boolean` | no |  |  |  | Provider supports proration on plan changes (upgrade / downgrade mid-period). Only meaningful when supportsSubscriptions=true. |
| `supportsMarketplace` | `Boolean` | no |  |  |  | Provider supports marketplace flows (connected accounts, transfers, payouts to sub-merchants). |
| `supportsConnectedKYC` | `Boolean` | no |  |  |  | Provider exposes a hosted KYC flow for connected accounts. Only meaningful when supportsMarketplace=true. |
| `supportsDisputes` | `Boolean` | no |  |  |  | Provider emits dispute / chargeback events on its webhook and accepts evidence submissions. |
| `supportsSavedCards` | `Boolean` | no |  |  |  | Provider supports tokenized payment methods that can be saved on a customer and re-used. |
| `supportsApplePayGooglePay` | `Boolean` | no |  |  |  | Provider's hosted fields / SDK support Apple Pay and Google Pay wallets. |
| `supports3DSecure` | `Boolean` | no |  |  |  | Provider supports 3-D Secure / SCA-compliant authentication for card payments. |
| `isMerchantOfRecord` | `Boolean` | no |  |  |  | Provider acts as merchant of record (handles tax collection, remittance, and compliance — e.g. Paddle, Lemon Squeezy). Affects how the framework wires tax-related hooks: when true, the framework does NOT emit tax-handling lifecycle hooks because the provider takes care of it. |
| `webhookStyle` | `PaymentWebhookStyle` | no |  | `hmac`, `rsa-pub`, `cert`, `signature`, `refetch` |  | Signature verification style used by this provider's webhooks. The adapter uses this hint at verification time. Values: 'hmac' (HMAC-SHA256 with a shared secret, e.g. Stripe, Adyen, Paddle), 'rsa-pub' (RSA public-key signature; no shipped adapter uses it), 'cert' (X.509 certificate, e.g. PayPal), 'signature' (custom signature scheme, e.g. Lemon Squeezy), 'refetch' (unsigned GET notification, the adapter re-fetches the resource, e.g. Mangopay). Defaults per `provider` enum value. |

## Constraints

Property rules:

- `webhookStyle` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
