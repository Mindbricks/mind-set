# InvoiceCapabilities

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [InvoiceCapabilities in Part 1](../ontology/InvoiceCapabilities.md)

Per-entry capability flags for an InvoiceProvider. Each flag advertises what the underlying provider can do behind this named entry; the framework gates design-time bindings accordingly and the runtime adapter refuses calls outside the advertised set. Defaults are derived from the `provider` enum value when this block is omitted. Set a flag to false to intentionally narrow capabilities — e.g. disable collection on an entry whose invoices are settled outside the platform.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `supportsFinalization` | `Boolean` | no |  |  |  | Provider distinguishes DRAFT from FINALIZED invoices — a finalized invoice is immutable and legally numbered. Providers without it treat every issued invoice as final immediately. |
| `supportsCollection` | `Boolean` | no |  |  |  | Provider can collect payment for the invoice itself (send-and-collect or charge-automatically flows). When false, the invoice is a document only and money moves through a PaymentProvider or outside the platform. |
| `supportsCreditNotes` | `Boolean` | no |  |  |  | Provider can issue credit notes / corrective invoices against a finalized invoice. |
| `supportsPartialPayments` | `Boolean` | no |  |  |  | Provider tracks partial payments against an invoice balance rather than a single paid/unpaid flag. |
| `supportsCustomerBalance` | `Boolean` | no |  |  |  | Provider keeps a per-customer running balance (credits, overpayments) that invoices can draw on. |
| `supportsVoid` | `Boolean` | no |  |  |  | Provider can VOID a finalized invoice (a legal cancellation that keeps the number). When false, correction happens through credit notes or deletion of drafts only. |
| `supportsPdfRendering` | `Boolean` | no |  |  |  | Provider renders a PDF document for the invoice that the framework can fetch and store/serve. |
| `supportsNumbering` | `Boolean` | no |  |  |  | Provider owns the legal invoice-number sequence. When false, the framework's own numbering (`invoicing.configuration.numbering`) is authoritative and the number is pushed to the provider. |
| `webhookStyle` | `InvoiceWebhookStyle` | no |  | `hmac`, `signature`, `none` |  | Signature verification style used by this provider's inbound webhooks, when it has any. Values: 'hmac' (HMAC-SHA256 over the raw body, shared secret — stripe), 'signature' (custom signature scheme), 'none' (no webhook surface — state advances by polling or synchronous responses; internal, the Turkish ERP adapters and all bridge brands). Defaults per `provider` enum value. |

## Constraints

Property rules:

- `webhookStyle` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
