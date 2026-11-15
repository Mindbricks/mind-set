# KycOnboardingConfig

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [KycOnboardingConfig in Part 2](../spec/KycOnboardingConfig.md)

Per-provider marketplace KYC onboarding configuration. Attached to a PaymentProvider when the provider supports marketplace + connected KYC. The `kycMode` discriminator drives both codegen (ConnectedAccountManager branches on it) and the panel UI affordance: hosted-url → 'Open onboarding' button; hosted-stepwise → 'Open dashboard' + pending-steps badge; document-api → 'Upload documents' + missing-types list; partner-referrals → 'Start referral' that mints a fresh URL.

Per-mode required fields:
- hosted-url: returnUrlTemplate
- hosted-stepwise: steps[] + dashboardDeepLinkTemplate
- document-api: documentTypes[] + merchantDashboardUrl
- partner-referrals: returnUrlTemplate (partnerAttributionId optional)
- none: no fields required (and the pattern should not be attached)

The per-provider tier/document/country matrix (Adyen AfP, Stripe Connect Express tiers, etc.) is intentionally NOT modeled here — that logic lives in each adapter's `createConnectedAccount` / `createKycSession` / `uploadKycDocument` implementation. This config only carries the discriminator + the configuration the codegen + panel need to branch on.

## Contained in

- [PaymentProvider](./PaymentProvider.md) as `kycOnboarding`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
