# LedgerApiBinding

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerApiBinding in Part 1](../ontology/LedgerApiBinding.md)

Binding overrides for one generated ledger API. A binding on an API the ledger does not generate raises LEDGER_API_BINDING_INERT. Per-API defaults live on LedgerGeneratedApis — the five mutating APIs default to internal-call only, getBalance to rest + internal, listEntries to rest, adjust to emit: false.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `emit` | `Boolean` | no | `true` |  |  | Whether this API is generated at all. Default true for every roster member except adjust and voidBySource (see LedgerGeneratedApis). |
| `internalCall` | `Boolean` | no |  |  |  | Expose the API on the service's in-process `API` namespace (fully parametric, runs asSystem) — the integration surface for lifecycle hooks and wrapper APIs. Per-API default: true for the five mutating APIs, adjust and getBalance, false for listEntries. adjust defaults to internalCall: true even though its emit default is false. |
| `rest` | `Boolean` | no |  |  |  | Expose the API as a REST endpoint. Per-API default: false for the five mutating APIs and adjust (adjust defaults to rest: false; session never enters the ledger core — declare a wrapper API for user-facing spends), true for getBalance and listEntries. HONOURED IN BOTH DIRECTIONS: rest: false emits `restSettings.hasRestController: false`, so the operation has NO router entry, no swagger path, no MCP tool and no route-manifest row — it stays callable on the internal-call namespace and from actions; rest: true emits the route at routePath. It was not always so: the emitter used to DROP the restSettings block for rest: false, and every route-emitting surface reads an absent block as MOUNTED, so a binding authored rest: false shipped the route anyway behind nothing but loginRequired. |
| `routePath` | `String` | no |  |  |  | Custom REST path override (only meaningful when rest is true). Leave null to auto-generate. |
| `checkRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Roles required to call the REST endpoint (OR logic, same semantics as ApiAuthOptions.checkRoles). Only meaningful when rest is true. SAFE DEFAULT FOR A MOUNTED MUTATION: the generated roster API carries loginRequired: true and no other gate, so a value-writing member (earn, consume, reserve, commitReservation, releaseReservation, adjust) bound to REST with an empty checkRoles is a mint/burn surface behind 'be logged in' — any authenticated caller of the service reaches it. The framework's default answer is therefore NOT to mount it at all (rest: false on every mutating member); binding one anyway raises LEDGER_REST_MUTATION_UNGATED until checkRoles names a role. It is a warning rather than a refusal because checkRoles needs RBAC and a project may run with accessControl.roleSettings.rbacIsActive: false, where no role can be named — there the only honest fix is to drop the rest binding and call the internal API from a wrapper that carries its own ownership or permission gate. |

## Constraints

Property rules:

- `checkRoles` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
