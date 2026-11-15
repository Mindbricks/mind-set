# InvoiceCollectionConfig

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [InvoiceCollectionConfig in Part 1](../ontology/InvoiceCollectionConfig.md)

How finalized invoices on an invoicing-enabled DataObject are collected. `sendInvoice` (the default) issues the invoice to the customer and waits for payment within daysUntilDue; `chargeAutomatically` charges a stored payment method at finalize time and requires the bound InvoiceProvider to have capabilities.supportsCollection=true (in practice: stripe). With external accounting providers, collection typically stays on the PaymentProvider side and this block keeps its sendInvoice default.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `collectionMethod` | `InvoiceCollectionMethod` | no | `"sendInvoice"` | `sendInvoice`, `chargeAutomatically` |  | 'sendInvoice' — the invoice is delivered to the customer and paid later; the invoice opens with a due date. 'chargeAutomatically' — the provider charges the customer's stored payment method when the invoice is finalized; requires capabilities.supportsCollection on the bound provider. |
| `daysUntilDue` | `Integer` | no |  |  |  | Days between issue date and due date under sendInvoice collection. Used to derive the due date when dueDateProperty is not bound. Ignored under chargeAutomatically. |

## Constraints

Property rules:

- `collectionMethod` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
