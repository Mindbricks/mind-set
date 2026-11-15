# Invoicing

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [Invoicing in Part 1](../ontology/Invoicing.md)

**Activation:** the pattern is switched on by `objectIsAnInvoiceObject`.

Provider-neutral accounts-receivable invoicing activation for a DataObject. Mark a DataObject as invoice-bearing by enabling `objectIsAnInvoiceObject` and (optionally) pointing `configuration.providerName` at a configured InvoiceProvider — when it is null, the framework-internal provider is the system of record (storage and lifecycle fully in the generated application; provider absence is not a special case but the `internal` adapter chosen implicitly). The framework generates the immutable invoice ledger (sys_<X>Invoice, sys_<X>InvoiceLine, sys_<X>CreditNote, sys_<X>InvoicePayment) and the issue/finalize/void/apply-payment surface around this object. The object itself stays the DOMAIN SURFACE: its schema is free, CRUD/UX/MScript live here, and it receives results through the PropRefer mirrors (statusProperty, ...) — it is never the financial record.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `objectIsAnInvoiceObject` | `Boolean` | yes |  |  |  | Enables accounts-receivable invoice logic for this object. When true, the object is treated as an invoice-bearing entity: the framework generates the sys_<X>Invoice ledger family and the invoice lifecycle surface bound to the configured (or internal) InvoiceProvider. |
| `configuration` | [`InvoicingConfig`](./InvoicingConfig.md) | no |  |  |  | The InvoicingConfig describing how this object maps onto the invoice ledger (provider binding, customer/amount/currency bindings, line relation, issue policy, numbering, collection, lifecycle hooks). Leave it null if objectIsAnInvoiceObject is false. |

## Constraints

Property rules:

- `objectIsAnInvoiceObject` must be present. Enforced only while `objectIsAnInvoiceObject` is on. (`REQUIRED_FIELD_MISSING`)
