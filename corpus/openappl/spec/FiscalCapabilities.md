# FiscalCapabilities

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [FiscalCapabilities in Part 1](../ontology/FiscalCapabilities.md)

Per-entry capability flags for a FiscalProvider. Each flag advertises what the provider and its network can do behind this named entry; the framework gates design-time bindings accordingly and the runtime adapter refuses calls outside the advertised set. Defaults are derived from the `provider` enum value when this block is omitted. The three MODE flags (clearance / exchange / reporting) are independent on purpose — one entry can serve several regimes, and the jurisdiction policy routes each document to a mode per its own rules (Turkey is itself hybrid: the same integrator entry produces an EXCHANGE route for registered e-invoice buyers and a REPORTING route for everyone else).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `supportsClearance` | `Boolean` | no |  |  |  | The authority approves the document BEFORE it is valid (clearance regimes: DIAN, NF-e). The pipeline must wait for approval before treating the document as issued. |
| `supportsExchange` | `Boolean` | no |  |  |  | The document travels to the recipient THROUGH the network (exchange regimes: Turkish e-invoice, SdI, KSeF). Delivery is part of the fiscal flow, not a separate email. |
| `supportsReporting` | `Boolean` | no |  |  |  | Document data is reported TO the authority after issuance (reporting regimes: Turkish e-archive, NAV). The document itself reaches the buyer outside the network. |
| `supportsValidation` | `Boolean` | no |  |  |  | Provider can pre-validate a document against the network's schema and business rules before submission. |
| `supportsSigning` | `Boolean` | no |  |  |  | Provider applies the legally required signature or seal itself. When false, the framework must deliver a signed document — v1 relies on providers that sign (integrators do), and direct-to-authority signing with a local HSM is out of scope. |
| `supportsCancellation` | `Boolean` | no |  |  |  | Provider can cancel an accepted document through the network's cancellation or objection flow. |
| `supportsCreditNote` | `Boolean` | no |  |  |  | Provider can submit credit notes / corrective documents referencing an accepted document. |
| `supportsStatusQuery` | `Boolean` | no |  |  |  | Provider can be POLLED for document status. In the GIB world polling is the norm and webhooks the exception — the fiscal status cron drives the FSM for entries with this flag. |
| `supportsInboundDocuments` | `Boolean` | no |  |  |  | Provider can fetch documents ADDRESSED TO the seller (incoming invoices). Opt-in, default false. Node.js uyumsoft implements it (inbox polling of decided documents); the other brands and the java / dotnet uyumsoft adapters answer inbound polling as unsupported. |
| `supportsArchiving` | `Boolean` | no |  |  |  | Provider offers legally compliant long-term archiving of submitted documents. |
| `supportsBuyerLookup` | `Boolean` | no |  |  |  | Provider can answer whether a tax id belongs to a registered network user (Turkey: is the buyer an e-invoice taxpayer?). The heart of Turkish routing — without it the policy falls back to reporting-mode for every buyer. |
| `webhookStyle` | `FiscalWebhookStyle` | no |  | `hmac`, `signature`, `none` |  | Signature verification style used by this provider's inbound webhooks, when it has any. Values: 'hmac' (HMAC over the raw body, shared secret), 'signature' (custom signature scheme), 'none' (no webhook surface — state advances by polling; the norm for GIB integrators). Defaults per `provider` enum value. |

## Constraints

Property rules:

- `webhookStyle` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
