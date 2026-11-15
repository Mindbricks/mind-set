# PaymentProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [PaymentProvider in Part 1](../ontology/PaymentProvider.md)

**Name:** an instance is named by `name`.

**Provider catalog:** the configuration keys of each brand are in [paymentProvider](./providers/paymentProvider.md).

A named payment provider configuration. The `name` is the lookup key used by `DataObject.checkout.providerName`, `DataObject.subscription.providerName`, `DataObject.marketplace.providerName`, `PaymentAction.providerName`, `RefundAction.providerName`, `SubscriptionAction.providerName`, `PayoutAction.providerName`, and the env-var prefix (e.g. `defaultStripe` → `PAYMENT_PROVIDER_DEFAULTSTRIPE_*`). The `provider` enum selects the backend SDK / adapter shipped under `_common/nodejs/src/common/payment-providers/`. The `capabilities` block reflects what the underlying provider can do — its defaults are derived from `provider`, advanced users can narrow them per-entry (e.g. disable subscriptions on a Stripe entry used only for one-time donations). The `configuration` is a free-form key/value list whose required keys depend on the chosen `provider`; the UI and the agent ontology doc enforce the per-provider shape.

Expected configuration keys per provider:
- stripe: secretKey, publishableKey, connectClientId (optional, marketplace), apiVersion (optional), kycReturnUrl (required for createKycSession — landing URL Stripe sends the merchant to after onboarding completes; can also be supplied per-call), kycRefreshUrl (optional, falls back to kycReturnUrl — URL Stripe sends the merchant to when the onboarding link expires), honourRadarReview (optional boolean, default true: a payment Stripe Radar places in review is held started / FRAUD_REVIEW until the review closes; approved settles it success, refunded_as_fraud or refunded settles it failed; only false turns it off), newCardThreeDSThreshold / savedCardThreeDSMode ('threshold' or 'verifyOnce': a stored card forced until a live read proves an authenticated 3-D Secure on it, then not forced; Stripe may still challenge) / savedCardThreeDSThreshold / threeDSRequestLevel ('any'|'challenge', default 'any') / threeDSThresholdCurrency (optional, server configuration only: at or above a threshold the PaymentIntent carries payment_method_options.card.request_three_d_secure, forcing 3-D Secure; below it Stripe and the issuer decide, the service cannot skip a challenge; unset = never forced; an unreadable value forces), savedCardOffSession (optional, 'never' default | 'verified', server configuration only: beside savedCardThreeDSMode 'verifyOnce', a charge from a PaymentAction declared buyerAbsent on a proven, verified stored card is a merchant-initiated off_session charge with no 3-D Secure liability shift; for buyer-absent charges under a stored-credential agreement only). NOTE: `webhookSecret` is deliberately NOT a stripe configuration key — the webhook endpoint and its signing secret are PROVISIONING STATE: the framework registers the endpoint and captures the secret itself (POST /v1/payments/admin/webhooks/provision), storing it under PAYMENT_PROVIDER_<NAME>_WEBHOOK_SECRET.
- paypal: clientId, clientSecret, webhookId, environment ('sandbox'|'live'), partnerAttributionId (optional, marketplace)
- iyzico: apiKey, secretKey, baseUrl (e.g. 'https://sandbox-api.iyzipay.com' or 'https://api.iyzipay.com'), subMerchantPrefix (optional, marketplace), savedCardThreeDSMode (optional, 'verifyOnce'|'threshold', server configuration only: verifyOnce skips 3-D Secure on a card once a 3-D Secure charge on it settled success, threshold skips it below savedCardThreeDSThreshold; unset = always 3-D Secure), savedCardThreeDSThreshold (optional, threshold mode), newCardThreeDSThreshold (optional, forces 3-D Secure on the hosted Checkout Form at or above it), directCardEntry (optional boolean, nodejs: the project's own frontend takes a new card and the service sends it to iyzico instead of the hosted Checkout Form; widens the merchant's PCI scope), marketplaceActive (optional boolean, nodejs: the merchant account is marketplace-activated; every basket is routed: a seller's split, or the platform's own sale by ownSaleStrategy; paymentGroup becomes framework-owned; a subscription in the default hosted mode may not bind such an entry), ownSaleStrategy (optional, 'listing'|'ownSubMerchant', default 'listing': how own sales are sent), ownSubMerchantKey (the operator's own sub-merchant key, required by 'ownSubMerchant'), subscriptionMode (optional, 'hosted'|'tokenized', default 'hosted', nodejs: 'tokenized' makes the framework recharge the buyer's stored card every period; the mode a marketplace-active entry uses for subscriptions). The slice-1 keys threeDSMode / nonThreeDSMaxAmount are retired: ignored at runtime (always 3-D Secure unless savedCardThreeDSMode says otherwise) and a validator warning (PAYMENT_PROVIDER_THREE_DS_KEYS_RETIRED)
- adyen: apiKey, merchantAccount, hmacKey, clientKey, environment ('test'|'live'), liveEndpointUrlPrefix (required when environment='live')
- paddle: vendorId, apiKey, webhookSecretKey (the notification destination secret key; verifies the Paddle-Signature h1 HMAC, required for webhooks only), environment ('sandbox'|'live'), priceMode (optional, 'auto'|'explicit'). `webhookPublicKey` is retired (Paddle Classic): it is ignored and draws a warning.
- lemonsqueezy: apiKey, storeId, signingSecret, webhookSecret (optional — the webhook-subscription secret; signingSecret is what verifies inbound webhooks)
- mangopay: clientId, apiKey, baseUrl (its host decides sandbox vs production, and the live-key guard reads it), environment ('sandbox'|'production'), payInDefaultReturnUrl. Mangopay hooks are unsigned GETs to the same webhook URL; the receiver re-fetches the resource with clientId + apiKey.
- custom: baseUrl, apiKey (optional), webhookSecret (optional), capabilitiesOverride (explicit JSON — escape hatch)

Secret keys (secretKey, clientSecret, apiKey, signingSecret, etc.) are masked in API responses and emitted to PAYMENT_PROVIDER_<NAME>_<KEY> env vars at codegen time.

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
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique provider identifier within the project. Used as the lookup key from DataObject checkout/subscription/marketplace opt-ins and from payment-related business-API actions, and as the env-var prefix. Must be a valid codeName. |
| `provider` | `PaymentProviderType` | no | `"stripe"` | `stripe`, `paypal`, `iyzico`, `adyen`, `paddle`, `lemonsqueezy`, `mangopay`, `custom` |  | The backend provider implementation. Selects which keys are expected in `configuration`, which capabilities the entry defaults to, and which adapter the codegen wires up. |
| `capabilities` | [`PaymentCapabilities`](./PaymentCapabilities.md) | no |  |  |  | Per-entry capability flags. Defaults are derived from `provider` at codegen time so designers don't fill them; advanced users can narrow them per-entry (e.g. disable subscriptions on a Stripe entry used only for one-time donations). Designers should leave this null unless intentionally restricting features the provider would otherwise support. |
| `configuration` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | Free-form key/value list of provider-specific credentials and settings. The required keys depend on `provider` — see the PaymentProvider doc string for the per-provider key list. The UI enforces the right form fields per provider; agents emit only keys that match. Sensitive keys (secretKey, clientSecret, apiKey, signingSecret, etc.) are masked in API responses and emitted to environment variables at codegen time. |
| `kycOnboarding` | [`KycOnboardingConfig`](./KycOnboardingConfig.md) | no |  |  |  | Marketplace KYC onboarding configuration. Only meaningful when capabilities.supportsMarketplace=true and capabilities.supportsConnectedKYC=true. The kycMode discriminator drives codegen branching (ConnectedAccountManager.startOnboarding) and panel UI affordance shape. Leave null to use the per-provider default; set explicitly to override the default mode or to wire a returnUrlTemplate / steps[] / documentTypes[] customized to the project's flow. |
| `payoutCadence` | [`PayoutCadenceConfig`](./PayoutCadenceConfig.md) | no |  |  |  | Payout scheduling + reserve configuration. Only meaningful when capabilities.supportsMarketplace=true. The mode discriminator drives codegen branching (PayoutManager.createPayout) and panel UI affordance (create button enabled/disabled/cadence label). Leave null to use the per-provider default. |
| `webhookOwnerService` | `String` | no |  |  |  | The service that receives this entry's provider webhooks when the payment patterns of MORE THAN ONE service bind the entry (a commerce service selling tickets and a plans service selling subscriptions on the same PSP account). A PSP account registers one webhook URL, so one service owns it: the owner verifies the vendor signature once, resolves whether the event's ticket is its own, and relays the verified, normalized event to the other services that carry the entry over the inter-service M2M channel; a relay is accepted only from the declared owner's verified machine identity. Name a service whose data objects carry a checkout, subscription or marketplace opt-in bound to this entry. Leave null when one service carries the entry; with several carriers and no owner the FIRST carrier in project order owns the URL and validation warns (PAYMENT_WEBHOOK_OWNER_UNDECLARED). The devops guide lists one webhook URL per entry and names the owner. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `configuration` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `UNIQUE_PAYMENT_PROVIDER_NAME` | error | Payment provider name "…" is used by … entries in projectSettings.paymentProvidersSettings.paymentProviders[]. |
