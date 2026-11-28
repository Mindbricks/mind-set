# Provider catalog

Provider settings (AI, payment, notification, storage and the other families) are lists of
named entries, each with a `provider` brand and a free-form `configuration`. The provider
catalog says, per family and brand, which configuration keys exist and how each is treated.
It ships in the schema [`openappl.json`](openappl-json.md) under `__providerConfigCatalog.doc`, next to the patterns, and every page of this section is generated from it.

What the catalog decides, and who reads it:

- **Validation.** Required keys must be present; a key the brand does not list is a typo and
  is rejected; an either/or `group` needs one complete group.
- **Secrets.** A key marked secret is never shown back in clear and reaches the generated
  service as a deployment secret ([compiler specification, chapter 10](../compiler/10-configuration-and-secrets.md)).
- **Environment names.** Each family gives the prefix and key style that turn a key into an
  environment variable name.
- **Aliases and defaults.** `mapsTo` names the key the runtime reads under another name;
  `default` and the allowed `values` drive forms and checks.
- **Brand state.** Where a family lists it, a brand is `shipped` (an adapter exists),
  `roadmap` (accepted, no adapter yet) or `bringYourOwn`.

Tools and settings screens build their configuration forms from the same data, so a form
shows exactly the keys a compiler accepts.

## The catalog in its own words

Machine-readable per-provider configuration key catalog. Single source of truth for the free-form configuration[] (DataMapSimpleItem) fields on the provider families below. Each family maps a provider brand to its expected configuration keys, each with a value type, a secret flag (masked in API responses + delivered via $SECRET_ env at deploy time), a required flag, and a doc line. Drives provider-aware frontend forms, structured agent schema, required-key + unknown-key validation, and secret classification. NOT a pattern class — the __ prefix keeps it out of pattern/enum discovery and the orphan checker. Per-family __envPrefix + __envKeyStyle describe how a key name becomes an environment variable (upperSnake: camelCase->UPPER_SNAKE; verbatim: kept as-is). mapsTo names a runtime alias the adapter reads under a different key (e.g. defaultModel->model). group tags an either/or set (at least one full group must be present). Keys marked required are validated as present; unknown keys (not listed for the selected brand) are rejected as typos. The bucketProvider family documents the FIXED-SHAPE BucketProviderConfig object (not a DataMapSimpleItem[] list): its keys are pattern-class fields, presence/auth-mode validation stays with the BucketProvider pattern validator, and env names that carry a brand infix (GCS_/AZURE_) are spelled out in the key docs. Every family also carries a `__credentials` slot. Its fields, for a settings UI and an agent: `overlayFamily` is the env-values / organization registry family name (null: no overlay); `credentialSets` says whether the Sandbox (test + stage rows) and Live (prod rows) sets apply; `credentialModes` lists the values of the reserved `credentialMode` key (`auto` = no row; `mock` only where `mockCredentialMode` is `allowed`, never for the prod slot); `mockBrand` names a blueprint brand that is itself a test double (a different thing from the credential mode); `liveDetection` says how the build tells that a base value reads live (`keyMode`, `environmentField`, `none`); `credentialScopes` lists the levels that can supply the credential (`saas` = the application owner's deploy secret; `tenant` / `resource` / `user` = the scoped-credential store), opted into through `scopeField`. Modes and slot-suffixed secrets are honoured by nodejs, rust and python services; a project with a service of another language gets the WARNING `PROVIDER_CREDENTIAL_MODE_RUNTIME_UNSUPPORTED`. Pinned to the code constants by src/patterns/__tests__/provider-config-catalog-credentials-8754.test.ts. The organization families with no entry here (graph, bigLoad, chat, amqp) have no catalogued keys and refuse the credential mode `mock`.

## Families

| Family | Entry pattern | Environment prefix | Brands | Keys |
|---|---|---|---|---|
| [aiProvider](providers/aiProvider.md) | [`AiProvider`](AiProvider.md) | `AI_PROVIDER` | 14 | 39 |
| [videoProvider](providers/videoProvider.md) | [`VideoProvider`](VideoProvider.md) | `VIDEO` | 13 | 29 |
| [notificationProvider](providers/notificationProvider.md) | [`NotificationProvider`](NotificationProvider.md) | `NOTIFICATION_PROVIDER` | 14 | 50 |
| [paymentProvider](providers/paymentProvider.md) | [`PaymentProvider`](PaymentProvider.md) | `PAYMENT_PROVIDER` | 8 | 63 |
| [invoiceProvider](providers/invoiceProvider.md) | [`InvoiceProvider`](InvoiceProvider.md) | `INVOICE_PROVIDER` | 6 | 15 |
| [fiscalProvider](providers/fiscalProvider.md) | [`FiscalProvider`](FiscalProvider.md) | `FISCAL_PROVIDER` | 7 | 123 |
| [decisionProvider](providers/decisionProvider.md) | [`DecisionProvider`](DecisionProvider.md) | `DECISION_PROVIDER` | 3 | 9 |
| [mailAccount](providers/mailAccount.md) | [`MailAccount`](MailAccount.md) | `MAIL_ACCOUNT` | 3 | 25 |
| [enterpriseIntegration](providers/enterpriseIntegration.md) | [`EnterpriseIntegration`](EnterpriseIntegration.md) | `ENTERPRISE` | 9 | 44 |
| [bucketProvider](providers/bucketProvider.md) | [`BucketProvider`](BucketProvider.md) | `BUCKET` | 5 | 31 |
| [socialLoginProvider](providers/socialLoginProvider.md) | [`SocialLoginProvider`](SocialLoginProvider.md) | `SOCIAL_LOGIN` | 7 | 17 |
