# FiscalLifecycleHook

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [FiscalLifecycleHook in Part 1](../ontology/FiscalLifecycleHook.md)

**Name:** an instance is named by `name`.

A designer-authored MScript handler fired by the fiscal dispatcher when the fiscal document state machine advances. Mirrors the InvoiceLifecycleHook shape (name / trigger / condition / script) but carries its OWN trigger vocabulary — the payment PaymentLifecycleTrigger enum is reconciled 1:1 with the payment lifecycle machines and the invoice family's InvoiceLifecycleTrigger is invoice-only; both deliberately stay untouched. Hooks run after the FSM transition is persisted; a failure inside a hook does not roll back the transition. The runtime dispatcher, the normalized resource surface and the per-trigger resource-field checks ship with the fiscal runtime slice.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique name of this hook within its parent FiscalizationConfig. Used in logs and the events table. |
| `trigger` | `FiscalLifecycleTrigger` | yes |  | `afterFiscalSubmitted`, `afterFiscalAccepted`, `afterFiscalRejected`, `afterFiscalCanceled`, `afterFiscalFailed` |  | Which fiscal document lifecycle event fires this hook. |
| `description` | `Text` | no |  |  |  | Human-readable explanation of what this hook does. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript boolean — when present and falsy, the hook is skipped for this event. Sees the same name as `script`: `fiscalDocument`. `this` is the generated `_hookCtx` whose only key is `fiscalDocument`, so `this.uuid` reads `undefined` (write `fiscalDocument.uuid`), and validation warns on it (LIFECYCLE_HOOK_THIS_NOT_IN_CONTEXT). |
| `script` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript body executed when the trigger fires. Runs from the fiscal dispatcher, not from a request - there is no request, session or user in scope. The document is reachable as `fiscalDocument`, a StoredFiscalDocument - the NORMALIZED fiscal document plus its ledger row id, not the raw sys_<X>FiscalDocument row: fiscalDocumentId (the sys_<X>FiscalDocument row id), invoiceId, providerName, network, scheme, documentType, direction, providerDocumentId, uuid (the ETTN), documentSerial, statusLiteral, rawStatus, submittedAt, clearedAt, rejectionReason, artifacts, metadata - and nothing else. The generated file binds it through `any`, so a field that is not on this list compiles and reads `undefined` at every fire. Service library helpers are reachable as `LIB.<module>(...)` and other rows through `API.<apiName>(...)` - the generated hook file does not import the dbLayer getters. Use hooks to fan out to other services (publish kafka events), update related records, or run application-side bookkeeping - e.g. stamping the assigned ETTN (`fiscalDocument.uuid`) back onto a domain record after acceptance. The owning row's id is `fiscalDocument.metadata.sourceObjectId`. On afterFiscalFailed `fiscalDocument.metadata.lastFiscalError` is `{ step, message }` when the engine's pipeline failed (bounded integrator text), and `fiscalDocument.rejectionReason` carries the integrator's text when a poll or webhook reported the failure. |

## Constraints

Property rules:

- `name`, `trigger`, `script` must be present. (`REQUIRED_FIELD_MISSING`)
- `trigger` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
