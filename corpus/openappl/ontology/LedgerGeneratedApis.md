# LedgerGeneratedApis

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerGeneratedApis in Part 2](../spec/LedgerGeneratedApis.md)

Per-API bindings for the generated roster. Declaring a binding on an API the ledger does not generate raises LEDGER_API_BINDING_INERT; enable its emit flag and prerequisites before overriding its transport. ROSTER DEFAULTS: the five mutating APIs (earn, consume, reserve, commitReservation, releaseReservation) emit as INTERNAL-CALL APIs only (internalCall: true, rest: false) — the integration story is a lifecycle hook or a designer-declared wrapper API awaiting `API.<api><LedgerName>({ ... })`; getBalance emits rest + internalCall and returns the available/pending/reserved triple plus the computed spendable; listEntries emits rest; adjust is OFF by default (emit: false) — an operator instrument, enable deliberately and gate it with checkRoles; voidBySource (reverse the lots one source credited, e.g. a refund before maturity) is OFF by default too and defaults to internalCall only.

TRANSPORT RULING: the rest flag is honoured in BOTH directions — rest: false emits hasRestController: false and mounts NOTHING, rest: true mounts the route — and the safe default for a MUTATING member is exactly that non-mounted shape. A mutating member bound to REST with an empty checkRoles admits any authenticated caller to a mint/burn operation and raises LEDGER_REST_MUTATION_UNGATED; either name a role in checkRoles, or keep the mutation internal and call it from a wrapper API that carries its own gate.

IDEMPOTENCY CONTRACT: `idempotencyKey` is a REQUIRED caller-supplied parameter on earn/consume/reserve, unique-indexed on the movement table by the framework. A REPLAY returns the ORIGINAL movement's result with `alreadyProcessed: true` — never a 409, because a network retry must not alarm the caller. The key identifies the OPERATION, not the attempt — derive it from the business fact (e.g. `pay:<providerIntentId>`), never suffix it with an attempt counter.

SESSION CANON: the mutating APIs run asSystem and are fully parametric — session-injected values never enter the ledger core. User-facing spends go through designer-declared wrapper APIs (REST, session-injected) that resolve the owner row from the session and call the internal API with explicit parameters. On nodejs, python, rust, java and dotnet, ledger APIs on a tenant-scoped owner object require `{ session: this.session }` as the optional second argument so their generated manager resolves the caller's tenant. A nodejs hook with a caller session uses the same argument. Omitting it leaves the session null; no session is inherited from AsyncLocalStorage or the running manager. Language targets without explicit-session support retain the sessionless signature.

## Contained in

- [LedgerConfig](./LedgerConfig.md) as `generatedApis`

## Contains

- `earn`: [LedgerApiBinding](./LedgerApiBinding.md)
- `consume`: [LedgerApiBinding](./LedgerApiBinding.md)
- `reserve`: [LedgerApiBinding](./LedgerApiBinding.md)
- `commitReservation`: [LedgerApiBinding](./LedgerApiBinding.md)
- `releaseReservation`: [LedgerApiBinding](./LedgerApiBinding.md)
- `getBalance`: [LedgerApiBinding](./LedgerApiBinding.md)
- `listEntries`: [LedgerApiBinding](./LedgerApiBinding.md)
- `adjust`: [LedgerApiBinding](./LedgerApiBinding.md)
- `voidBySource`: [LedgerApiBinding](./LedgerApiBinding.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
