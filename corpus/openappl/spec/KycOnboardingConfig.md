# KycOnboardingConfig

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [KycOnboardingConfig in Part 1](../ontology/KycOnboardingConfig.md)

Per-provider marketplace KYC onboarding configuration. Attached to a PaymentProvider when the provider supports marketplace + connected KYC. The `kycMode` discriminator drives both codegen (ConnectedAccountManager branches on it) and the panel UI affordance: hosted-url → 'Open onboarding' button; hosted-stepwise → 'Open dashboard' + pending-steps badge; document-api → 'Upload documents' + missing-types list; partner-referrals → 'Start referral' that mints a fresh URL.

Per-mode required fields:
- hosted-url: returnUrlTemplate
- hosted-stepwise: steps[] + dashboardDeepLinkTemplate
- document-api: documentTypes[] + merchantDashboardUrl
- partner-referrals: returnUrlTemplate (partnerAttributionId optional)
- none: no fields required (and the pattern should not be attached)

The per-provider tier/document/country matrix (Adyen AfP, Stripe Connect Express tiers, etc.) is intentionally NOT modeled here — that logic lives in each adapter's `createConnectedAccount` / `createKycSession` / `uploadKycDocument` implementation. This config only carries the discriminator + the configuration the codegen + panel need to branch on.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `kycMode` | `KycMode` | no |  | `hosted-url`, `hosted-stepwise`, `document-api`, `partner-referrals`, `none` |  | Discriminator for the onboarding flow shape. Leave null to take the PER-PROVIDER default (stripe → hosted-url, paypal → partner-referrals, iyzico/adyen → hosted-stepwise, mangopay → document-api, paddle/lemonsqueezy → none); set it to override that default. There is deliberately NO schema-level default here: a single global one would be wrong for every provider but stripe, and the mode a provider cannot serve (iyzico has no hosted onboarding URL) must never be the mode the platform picks for it. |
| `returnUrlTemplate` | `String` | no |  |  |  | (hosted-url / partner-referrals) URL template the provider redirects to after onboarding completes (a page of YOUR app). Tokens: `{accountId}` = the local connected-account row id (what the /v1/payments/connected-accounts/:accountId routes take), `{providerAccountId}` = the provider-side account id. Required for hosted-url and partner-referrals modes. |
| `steps` | `String`[] | no |  |  |  | (hosted-stepwise) Ordered list of onboarding steps the provider walks an operator through (e.g. ['basic','iban','identity','contract'] for iyzico sub-merchant; ['tier1','tier2','documents','bank'] for Adyen AfP). The panel renders a per-step pending badge against this list. Required for hosted-stepwise mode. |
| `dashboardDeepLinkTemplate` | `String` | no |  |  |  | (hosted-stepwise) URL template the panel deep-links operators to - a PROVIDER dashboard, so `{accountId}` and `{providerAccountId}` both resolve to the provider-side account id at runtime (a row with no providerAccountId is refused 409 CONNECTED_ACCOUNT_NOT_PROVISIONED). Required for hosted-stepwise mode. |
| `documentTypes` | `String`[] | no |  |  |  | (document-api) Ordered list of KYC document types the provider needs (e.g. ['IDENTITY_PROOF','ADDRESS_PROOF','ARTICLES_OF_ASSOCIATION'] for Mangopay LegalUser). The panel renders a per-type missing-badge and the ConnectedAccountManager.uploadKycDocument call gates against this set. Required for document-api mode. |
| `merchantDashboardUrl` | `String` | no |  |  |  | (document-api) Merchant-side dashboard URL the panel deep-links operators to. For Mangopay this is the hub URL (https://hub.mangopay.com/users/{providerAccountId}/kyc); the provider exposes no hosted shopper-facing UI. `{accountId}` and `{providerAccountId}` both resolve to the provider-side account id here. Required for document-api mode. |
| `partnerAttributionId` | `String` | no |  |  |  | (partner-referrals) Optional partner attribution id forwarded on the Partner Referrals create call. Only meaningful for PayPal-style flows. |

## Constraints

Property rules:

- `kycMode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
