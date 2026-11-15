# PaymentCapabilities

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [PaymentCapabilities in Part 2](../spec/PaymentCapabilities.md)

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

## Contained in

- [PaymentProvider](./PaymentProvider.md) as `capabilities`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
