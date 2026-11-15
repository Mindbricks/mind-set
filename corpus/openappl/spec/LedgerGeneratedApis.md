# LedgerGeneratedApis

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerGeneratedApis in Part 1](../ontology/LedgerGeneratedApis.md)

Per-API bindings for the generated roster. Declaring a binding on an API the ledger does not generate raises LEDGER_API_BINDING_INERT; enable its emit flag and prerequisites before overriding its transport. ROSTER DEFAULTS: the five mutating APIs (earn, consume, reserve, commitReservation, releaseReservation) emit as INTERNAL-CALL APIs only (internalCall: true, rest: false) — the integration story is a lifecycle hook or a designer-declared wrapper API awaiting `API.<api><LedgerName>({ ... })`; getBalance emits rest + internalCall and returns the available/pending/reserved triple plus the computed spendable; listEntries emits rest; adjust is OFF by default (emit: false) — an operator instrument, enable deliberately and gate it with checkRoles; voidBySource (reverse the lots one source credited, e.g. a refund before maturity) is OFF by default too and defaults to internalCall only.

TRANSPORT RULING: the rest flag is honoured in BOTH directions — rest: false emits hasRestController: false and mounts NOTHING, rest: true mounts the route — and the safe default for a MUTATING member is exactly that non-mounted shape. A mutating member bound to REST with an empty checkRoles admits any authenticated caller to a mint/burn operation and raises LEDGER_REST_MUTATION_UNGATED; either name a role in checkRoles, or keep the mutation internal and call it from a wrapper API that carries its own gate.

IDEMPOTENCY CONTRACT: `idempotencyKey` is a REQUIRED caller-supplied parameter on earn/consume/reserve, unique-indexed on the movement table by the framework. A REPLAY returns the ORIGINAL movement's result with `alreadyProcessed: true` — never a 409, because a network retry must not alarm the caller. The key identifies the OPERATION, not the attempt — derive it from the business fact (e.g. `pay:<providerIntentId>`), never suffix it with an attempt counter.

SESSION CANON: the mutating APIs run asSystem and are fully parametric — session-injected values never enter the ledger core. User-facing spends go through designer-declared wrapper APIs (REST, session-injected) that resolve the owner row from the session and call the internal API with explicit parameters. On nodejs, python, rust, java and dotnet, ledger APIs on a tenant-scoped owner object require `{ session: this.session }` as the optional second argument so their generated manager resolves the caller's tenant. A nodejs hook with a caller session uses the same argument. Omitting it leaves the session null; no session is inherited from AsyncLocalStorage or the running manager. Language targets without explicit-session support retain the sessionless signature.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `earn` | [`LedgerApiBinding`](./LedgerApiBinding.md) | no |  |  |  | Credit a lot to an owner (source ref + required idempotencyKey; optional availableAt). Default binding: emit true, internalCall true, rest false. |
| `consume` | [`LedgerApiBinding`](./LedgerApiBinding.md) | no |  |  |  | Consume available value from an owner's lots per the consumptionPolicy (target ref + required idempotencyKey). Default binding: emit true, internalCall true, rest false. |
| `reserve` | [`LedgerApiBinding`](./LedgerApiBinding.md) | no |  |  |  | Place a two-phase hold on available value (target ref + required idempotencyKey; requires reservation.enabled). Default binding: emit true, internalCall true, rest false. |
| `commitReservation` | [`LedgerApiBinding`](./LedgerApiBinding.md) | no |  |  |  | Consume a hold by replaying its persisted allocation plan (per commitPolicy). Default binding: emit true, internalCall true, rest false. |
| `releaseReservation` | [`LedgerApiBinding`](./LedgerApiBinding.md) | no |  |  |  | Release a hold, restoring lots and balance in one transaction. Default binding: emit true, internalCall true, rest false. |
| `getBalance` | [`LedgerApiBinding`](./LedgerApiBinding.md) | no |  |  |  | Read the three-number balance — available (mature + unreserved), pending (unmatured), reserved — plus the computed spendable. Default binding: emit true, internalCall true, rest true. |
| `listEntries` | [`LedgerApiBinding`](./LedgerApiBinding.md) | no |  |  |  | List an owner's lots (remaining, maturity, expiry, source). Default binding: emit true, rest true. |
| `adjust` | [`LedgerApiBinding`](./LedgerApiBinding.md) | no |  |  |  | Operator correction: credit or debit outside the normal earn/consume flow, always with a required reason and idempotencyKey. Default binding: emit FALSE — enable deliberately and gate with checkRoles. |
| `voidBySource` | [`LedgerApiBinding`](./LedgerApiBinding.md) | no |  |  |  | Reverse what ONE source credited to an owner (`void<LedgerName>BySource({ ownerId, sourceRef, sourceType?, idempotencyKey?, reason? })`), e.g. a refund of an order whose earning has not matured yet. Every lot stamped with that source ref that is still pending or available loses its UNRESERVED remainder (unmatured lots leave pending, matured lots leave available, a drained lot becomes `voided`), recorded as ONE `void` movement. What the source credited but the ledger no longer holds (spent, held by an open reservation, expired) is answered as `shortfall` and is never booked as a debt or a negative lot. Idempotent by the source: an omitted idempotencyKey is derived from the owner and the source ref. A source with no lot on the owner is a typed 404 (LEDGER_SOURCE_NOT_FOUND). Emitted by the nodejs, java, dotnet and python ledger layers; other languages refuse an enabled binding (LEDGER_VOID_BY_SOURCE_LANGUAGE_UNSUPPORTED). Default binding: emit FALSE, internalCall true, rest false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
