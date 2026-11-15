# FiscalizationConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [FiscalizationConfig in Part 2](../spec/FiscalizationConfig.md)

Configuration for regulatory fiscalization on a DataObject. Provider-binding is explicit via `fiscalProviderName` (lookup into projectSettings.fiscalProvidersSettings.fiscalProviders[]); when null and EXACTLY ONE fiscal provider is declared, the framework binds that one implicitly (single-provider convenience) — with zero or several declared providers a null binding is a design error, because unlike invoicing there is no framework-internal fiscal authority to fall back to. `jurisdiction` selects the fiscal policy module compiled into the service (v1 ships the Turkish policy; other ISO codes are accepted with a roadmap warning). The trigger is DECLARATIVE (`submitPolicy` / `submitCondition`) — the designer never writes imperative glue; `submitPolicy: manual` plus fiscal actions is the imperative escape hatch (Faz 3 runtime slices). SERIES OWNERSHIP IS PER SERVICE. A fiscalProviders[] entry is one integrator account with ONE serialPrefix, and the wire-serial counter (sys_fiscalSerialSequence) lives in the EMITTING service's own database, so two services bound to one entry keep two private counters for what the vendor sees as a single series - and the integrator burn-and-retry hides the collision while it spends real serials out of a live account. Binding a second service to an entry another service already fiscalizes through is therefore REFUSED at design time (FISCAL_SERIAL_NAMESPACE_SHARED, ERROR). The exception is an entry with serialAssignment "vendor" (uyumsoft, mock): the integrator numbers its documents and no service keeps a counter, so several services may bind it (a serialAssignment left blank for deploy time is judged as platform numbering; with supportsInboundDocuments on, the shared entry WARNS FISCAL_INBOUND_SHARED_ACCOUNT because every binding service polls the one inbox). To fiscalize from two services on platform numbering: register a second serial series with the integrator, declare a second entry with the same brand and the same credentials and its OWN serialPrefix, and bind that entry from the second service. The document number's human shape differs per service as a result; that is intended, not a defect. Inbound vendor documents are not supported on a tenant-scoped fiscal object: the fiscal ledger carries a tenant field even for a SaaS-level source or a fiscal-only object without an invoice, while vendor inbox documents carry none. Binding an inbound-capable provider there reports FISCAL_INBOUND_TENANT_UNSUPPORTED (WARNING), and codegen excludes the object from inbound ingestion; no inbound cron, mount or schedule is emitted when all inbound-capable objects are tenant-scoped. Outbound fiscalization remains valid. Tenant attribution for inbound documents is postponed.

## Contained in

- [Fiscalization](./Fiscalization.md) as `configuration`

## Contains

- `sellerParty`: [FiscalPartyConfig](./FiscalPartyConfig.md)
- `buyerParty`: [FiscalPartyConfig](./FiscalPartyConfig.md)
- `internetSale`: [FiscalInternetSaleConfig](./FiscalInternetSaleConfig.md)
- `lifecycleHooks`: [FiscalLifecycleHook](./FiscalLifecycleHook.md), a list

## References

- `originalRefProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
