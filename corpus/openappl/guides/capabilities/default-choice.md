---
title: Default choice
---

# Default choice

A first-class **default row** pattern. Some data objects have a "default"
row: a default address, a default saved card, a default shipping company.
Declare `objectSettings.defaultChoice.isActive: true` on the object and the
generated service adds the flag, keeps the one-default invariant, picks the first row
as the default, promotes the newest remaining row when the default is
deleted, and generates the four apis that read and move it. No hand-written
`isDefault` handling, no "unset the others" action, no fallback logic.

**Also searchable as:** defaultChoice, DefaultChoice, default row, isDefault,
default address, default payment method, default shipping company, system
default, per-user default, user preference.

> **Reference:** [`DefaultChoice`](../../spec/DefaultChoice.md) ·
> [`ObjectSettings`](../../spec/ObjectSettings.md) ·
> [`PropRefer`](../../spec/PropRefer.md) ·
> [`CompositeIndex`](../../spec/CompositeIndex.md)

## Two shapes

| mode | when | where the default lives |
|---|---|---|
| **inline** (`inline: true`, the default) | the object already belongs to a user: an address, a saved card, a user's membership row | the `isDefault` flag on the object's own row, one per **scope** (the owner field, or `scopeField`) |
| **related** (`inline: false`) | the object is global: a shipping company, a currency | `isDefault` marks the ONE **system default** (per tenant); each user may override it with a row of the generated `sys_UserDefaultFor<Object>` table |

An existing relation object (a user's news-site membership, say) is just the
inline case: the relation row is the object, and its user field is the scope.

```json
"objectSettings": {
  "basicSettings": { "name": "address" },
  "defaultChoice": { "isActive": true }
}
```

```json
"objectSettings": {
  "basicSettings": { "name": "carrier" },
  "defaultChoice": { "isActive": true, "inline": false }
}
```

```json
"objectSettings": {
  "basicSettings": { "name": "siteMembership" },
  "defaultChoice": { "isActive": true, "scopeField": "memberId" }
}
```

## What the pattern adds

- **The `isDefault` column** - Boolean, default `false`, indexed. A
  compiler-managed column: it is never a request parameter and never a
  `dataClauseItems` value. A author-defined create or update api that binds or
  writes it is refused at design time (`DEFAULT_CHOICE_MANAGED_COLUMN_WRITTEN`),
  because an authored write could leave a scope with two defaults or none.
  The only way to move the default is `set<Object>AsDefault`.
- **The invariant** - at most one `isDefault = true` per scope (and per tenant
  on a tenant-level object), enforced by a **partial unique index** the
  pattern declares as a `compositeIndexSettings` entry
  (`defaultChoiceOneDefaultPerScope`, `partialWhere: { isDefault: true }`).
  The index rides the same path every declared index does: created by the
  model, reconciled at boot like any other, and the database is its arbiter.
- **The first row becomes the default** - a new row of a scope that has no
  default claims it (in the db layer's after-create step, so a cron, an internal
  call or a seed claims it too, not only the REST create). A bulk create
  (`createBulk<Object>`) passes the same step once per inserted row, in batch
  order, so the first row of a scope that arrives in a bulk claims the
  default and the rest of the batch sees it claimed. A bulk restore of
  archived rows (`update<Object>ByIdList` with `isActive: true`) passes the
  after-update step per restored row, so the restore reconcile runs for each.
- **Deleting the default promotes the newest remaining row** - hard or soft
  delete, by id, by query or through a cascade (the db layer's after-delete
  step). No remaining row means no default. On a soft-delete object the
  archived row's own flag is cleared through the db layer (an update event on
  the archived row), so a later restore cannot bring back a second default.
- **Related mode only: `sys_UserDefaultFor<Object>`** - `userId`,
  `default<Object>Id` (a FK to the object, `doDelete`), the tenant column when
  the object is tenant-level, unique per user. Deleting an object removes the
  override rows that point at it, so those users fall back to the system
  default.

## The four apis

The names are fixed per object; `<Object>` is the object name capitalized
(`setAddressAsDefault`, `getDefaultCarrierForUser`).

| api | inline | related |
|---|---|---|
| `set<Object>AsDefault(id)` <br> `POST /set<object>asdefault/:id` | makes the row the default of its own scope. The caller passes the object's normal ownership check; with a `scopeField` that is not the owner field, the row's scope must be the session user (operator excepted) | sets the **system** default. Platform operator only (`admin` / `superAdmin`; `saasAdmin` / `superAdmin` on a multi-tenant project; the tenant owner where a tenant filter rides) |
| `getDefault<Object>()` <br> `GET /getdefault<object>` | the session user's default, or `null` | the system default, or `null` |
| `set<Object>AsDefaultForUser(id, userId?)` <br> `POST /set<object>asdefaultforuser/:id` | the same, for another user's scope. `userId` absent = the session user; another `userId` is operator-only (403 `DEFAULT_CHOICE_FORBIDDEN`); the row must belong to that user's scope (409 `DEFAULT_CHOICE_SCOPE_MISMATCH`) | writes the user's row of `sys_UserDefaultFor<Object>`. Same `userId` rule |
| `getDefault<Object>ForUser(userId?)` <br> `GET /getdefault<object>foruser?userId=` | that user's default | the user's own choice when it exists and still points at a live row, else the system default |

Every answer of the two reads carries **`defaultSource`**: `"user"` or
`"system"` (`null` when there is no default), beside the row under the
object's own key:

```json
{ "carrier": { "id": "…", "name": "DHL", "isDefault": true }, "defaultSource": "system", "userId": "u-42" }
```

A set answers the row as it now stands plus what moved:

```json
{ "address": { "id": "a-2", "isDefault": true }, "defaultChoice": { "id": "a-2", "previousDefaultId": "a-1", "changed": true, "userId": "u-42", "defaultSource": "user" } }
```

### Atomicity and events

A set is **atomic**: unsetting the previous default and setting the new one
happen in one transaction (the target row and the current default are
locked, so two setters of one scope serialize; a third row claimed in between
is refused by the partial unique index and the flip is retried against a
fresh read). After the commit both rows go out on the **normal update
events** through the db layer, so the search index, the entity cache and
every db-event subscriber see them. Under contradictory concurrent sets the
invariant holds (exactly one default); which of the contenders wins is not
defined.

On MongoDB the two writes go through the db layer in order and the partial
unique index alone arbitrates.

### Who may do what

- The inline `set<Object>AsDefault` rides the object's **own ownership
  check** (the owner field, session-fed, like every ownership gate); absolute
  roles bypass it like everywhere else.
- The related `set<Object>AsDefault` is gated by `checkRoles` on the platform
  operator, re-spelled for a multi-tenant project like every generated gate.
- The two `...ForUser` apis decide at runtime: the session user may act for
  themselves; the platform operator for anyone (`DEFAULT_CHOICE_FORBIDDEN`
  otherwise).
- All four require a login and are never `apiInSaasLevel`.

## Validation

| code | severity | meaning |
|---|---|---|
| `DEFAULT_CHOICE_SCOPE_MISSING` | error | inline, no `scopeField`, and the object declares no owner field: nothing groups the rows into scopes |
| `DEFAULT_CHOICE_SCOPE_FIELD_NOT_FOUND` | error | `scopeField` is not a property of the object |
| `DEFAULT_CHOICE_SCOPE_FIELD_IGNORED` | warning | `scopeField` in related mode (ignored) |
| `DEFAULT_CHOICE_COLUMN_CONFLICT` | error | an authored `isDefault` that is not a Boolean |
| `DEFAULT_CHOICE_COLUMN_MANAGED` | warning | an authored Boolean `isDefault`: the pattern manages it |
| `DEFAULT_CHOICE_RELATED_WITH_OWNER` | warning | related mode on an object with an owner field - did you mean inline? |
| `DEFAULT_CHOICE_MANAGED_COLUMN_WRITTEN` | error | a create / update api binds a parameter or writes a `dataClauseItems` entry named `isDefault` |
| `DEFAULT_CHOICE_ON_SYSTEM_OBJECT` | error | an auth-service object or a compiler-managed `sys_` object |
| `DEFAULT_CHOICE_LANGUAGE_UNSUPPORTED` | error | the compiler for the service's target language does not yet generate the default-row family |

## Runtime refusals

| code | status | when |
|---|---|---|
| `DEFAULT_CHOICE_FORBIDDEN` | 403 | acting for another user without the operator role; an inline set on a row outside the caller's scope |
| `DEFAULT_CHOICE_NOT_FOUND` | 404 | the addressed row does not exist (or is archived) |
| `DEFAULT_CHOICE_SCOPE_MISMATCH` | 409 | `set<Object>AsDefaultForUser` on a row that is not in that user's scope |

## The saved payment-method store

The payment layer's own saved-payment-method default (`sys_paymentMethod`)
is a compiler-managed table, never declared through this block (a `sys_` object is
refused, `DEFAULT_CHOICE_ON_SYSTEM_OBJECT`). Where the compiler supports it,
the generated service binds it to the same engine, with the scope `userId` +
`providerName` (a buyer has one default per payment provider entry, the
columns of its partial unique index): the first method filed in a scope
becomes its default whichever path filed it, deleting the default promotes
the newest remaining method, and a restore reconciles the scope. A method
with no `providerName` is outside. The store keeps its own routes (no
`set<Object>AsDefault` apis): `POST /v1/payment-methods/default/:id` clears
and sets under the partial unique index and sets again when a concurrent set
landed in between. A save asks for the default with `makeDefault: true`.
