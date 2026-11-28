---
title: Property types
---

# Property types

Every entry in a `DataObject.properties[]` declares its `basicSettings.type` from the fixed `DataTypes` enum. The catalogue is the same across every storage backend; the compiler maps each type to the appropriate column or document field.

## Property shape

A property is a [`DataProperty`](../../spec/DataProperty.md) with a required [`basicSettings`](../../spec/PropertyBasicSettings.md) block plus optional blocks. Most properties only need `basicSettings`:

```json
{
  "basicSettings": {
    "name": "title",
    "type": "String",
    "isRequired": true,
    "isArray": false,
    "description": "Short title shown in listings.",
    "defaultValue": "Untitled"
  }
}
```

Optional siblings of `basicSettings` (each activates by **block presence**: populate it to turn the capability on):

- `indexSettings`: DB index, unique constraint, Elasticsearch indexing, Redis cache hooks. See [Indexes](indexes.md).
- `relationSettings`: foreign-key target; populating this block (with `relationTargetObject` set) *is* the relation. See [Relations](relations.md).
- `sessionSettings`: auto-inject from the session context (for example `userId`, the tenant id).
- `staticJoin`: copy a value from a related object at write time.
- `decisionSource`: let a decision provider decide the value at write time (a judgement about the row, such as a category or a priority). See [Decided properties](#decided-properties-decisionsource).

## Type catalogue

The `DataTypes` enum has sixteen entries (`Blob` is used internally and is rarely declared by hand). The catalogue is the same across both engines; each entry lists its **PostgreSQL** and **MongoDB** mapping, selected per service by `serviceOptions.dbType`.

### `ID`

UUID-shaped identifier. Used for primary keys (generated automatically as `id`), foreign-key columns, and opaque references. Stored as a `UUID` column in PostgreSQL and as a string field in MongoDB: ids are deliberately UUID v4 in both engines (not MongoDB `ObjectId`) so an id is identical wherever the row is read.

```json
{ "basicSettings": { "name": "userId", "type": "ID", "isRequired": true } }
```

### `String`

Short text values with a length limit. PostgreSQL `VARCHAR(n)`, where n is `basicSettings.maxLength` (255 when it is absent); MongoDB string.

```json
{ "basicSettings": { "name": "slug", "type": "String" } }
```

```json
{ "basicSettings": { "name": "summary", "type": "String", "maxLength": 1000 } }
```

`maxLength` is optional and belongs to `String` only: on `Text`, `Enum`, `ID` or any other type it is a design-time error (`MAX_LENGTH_ON_NON_STRING`). It is a whole number from 1 to 10485760, the PostgreSQL varchar limit. Leaving it out keeps the `varchar(255)` column every String property has by default, so adding the key later with the value 255 changes no DDL.

The generated service checks the length **before the write**. A value longer than the limit is refused with `422 VALIDATION_ERROR` and the detail names the field (`Offending field(s): summary.`), never the value. This is the same answer on the api pipeline and on a hand-written route. The check counts the way PostgreSQL counts:

- characters are Unicode code points, so an emoji is one character;
- a `String[]` list is checked per element;
- trailing spaces PostgreSQL would trim are not counted;
- a null value is not checked here (`isRequired` decides nullability).

The check reads the value that is stored. A `hashed` column stores a 60-character bcrypt digest, so a `maxLength` below 60 on it is a design-time error (`MAX_LENGTH_BELOW_HASH_DIGEST`).

Every generated write runs the check, including the ones that skip the rest of the model validation. A numeric-mutation update (`$inc`, `$dec`, `$incIf`) writes its counter in one statement the database computes, so its other validators do not run, but the plain values it carries beside the counter are still checked before that statement. An over-long String there answers the same 422, and the counter is not changed.

A write that bypasses the generated code still reaches PostgreSQL. An example is a raw SQL query in custom code. If such a value is too long, PostgreSQL refuses it and the caller gets the sanitized `400 BAD_REQUEST` (SQLSTATE 22001), which does not name the field. That answer is correct; see [Error handling](../workflow/error-handling.md).

On a MongoDB service there is no varchar column, so only an explicit `maxLength` is checked; a String without one is not limited. The generated writers check the limit before they write on every path (create, update by id, by id list and by query, the numeric and array operators included, the `doUpdate` merge of a duplicate create, and a write-once fill). A failure is the same 422 naming the field. The array-operator update by query checks each resolved row before its write, so a later refusal can leave earlier rows written. Not checked: an update document that custom code sends to the model directly, and a dotted or positional path such as `tags.0`.

A compiler may not enforce `maxLength` for every target language. When the service's language does not enforce it, validation reports the warning `MAX_LENGTH_NOT_ENFORCED`; the declaration is still accepted.

Changing `maxLength` on a property that already has a table:

- **Raising it** widens the varchar column where the service reconciles its schema at boot (development-style deployments). Where schema changes ship only as migrations, the existing column is not changed: the service reports a pending schema change, and no migration is generated for it, because the migration snapshot does not record the length of a String. Until the column is widened, the model accepts values up to the new `maxLength` while the column still holds the old length, so a value between the two is refused by PostgreSQL and the caller gets the sanitized `400 BAD_REQUEST`, not the 422. To use the new limit on such a database, widen the column yourself with a hand-written migration, for example `ALTER TABLE "<table>" ALTER COLUMN "<column>" TYPE VARCHAR(1000);` (PostgreSQL does not rewrite the table for a longer varchar). A table created after the change gets the new length directly.
- **Lowering it** is never applied to an existing column by DDL. The check refuses new values above the new limit with 422; longer values already stored are kept, and the service reports the narrower declaration as a pending change.

### `Text`

Long-form text (descriptions, rich-text bodies). PostgreSQL `TEXT`; MongoDB string. Supports full-text search in Elasticsearch when `indexSettings.indexedInElastic: true`.

### `Integer`

4-byte signed integer. PostgreSQL `INTEGER`; MongoDB number. Use for counts, indices, ages.

### `Short`

2-byte short integer. PostgreSQL `SMALLINT`; MongoDB number. Useful for flags and small counts.

### `Double`

8-byte double-precision float. PostgreSQL `DOUBLE PRECISION`; MongoDB number. Use for measurements and ratios whose last digit does not have to be exact.

**Not for money.** Use `Decimal` below. A `Double` carries no declared scale, so nothing rounds it: `3 x 16.10` stores as `48.300000000000004`, and that number travels onto the payment intent, the invoice and the fiscal document, because every hop reads the column verbatim.

### `Decimal`

A **fixed-scale** number: the column declares how many fractional digits it carries, and the service rounds every value written to it to exactly that many, **half-to-even**.

```json
{
  "basicSettings": {
    "name": "total",
    "type": "Decimal",
    "decimalScale": 2,
    "isRequired": true
  }
}
```

`decimalScale` is optional and resolves to **2**, the money default. The legal range is `0` to `6`: `0` for a whole-unit currency (JPY, KRW), `2` for the ordinary case, `3` to `6` for a rate or a unit price quoted below the currency's smallest unit. Setting it on any other type is a design-time error (`DECIMAL_SCALE_ON_NON_DECIMAL`), because nothing would read it; a scale outside `0` to `6` is `VALUE_OUT_OF_RANGE`. Two columns in the same money flow must declare the same scale, or a value rounded to 2 on one row and 4 on the next stops reconciling.

Rounding happens at every **write boundary**, and the boundary every write passes is the generated data-access layer: its create, bulk-create, update-by-id, update-by-id-list and update-by-query helpers round the `Decimal` columns of the payload they are handed (including the upsert of an `onDuplicate: doUpdate` index and the bulk create's update of a row whose id exists). That is where a business api, a `createCrudAction` / `createBulkCrudAction` / `updateCrudAction`, a seed record and custom code calling the data-access layer all write, so each of them stores the rounded value. Earlier in the same request, a `Decimal` request parameter is rounded right after its `transform` and the api's data clause is rounded before the write; the amount handed to a payment provider, and the single amount handed to an invoice provider, are rounded too. The roundings agree (rounding an already-rounded value changes nothing). A numeric mutation on a `Decimal` column (`$inc`, `$dec`, `$incIf`, `updateWhere`) has its operand rounded to the column's scale when the mutation is planned (`$inc: 0.105` on `Decimal(2)` adds `0.10`), and the database assignment rounds its own result to the scale in the same statement, so `1.1 + 0.1` on a `Decimal(1)` column stores exactly `1.2`, not the binary `1.2000000000000002`. Only a direct ORM model call in custom code, which bypasses the data-access layer, is not rounded. Half-to-even ("banker's rounding") sends an exact `.5` to the nearest even last digit, so a long series of them does not drift upward the way half-up rounding does.

**A money column bound to a payment, marketplace or invoicing `amountProperty` must be `Decimal`.** A bound column declared `Integer`, `Short`, `Double` or `Float` is migrated by validation to `Decimal` (scale from the binding's static currency: 0 for JPY, 3 for KWD, otherwise 2, unless the column already declares one) and reported as an auto-fix, so a stored blueprint keeps building; a non-numeric column there is refused with `MONEY_BINDING_NOT_DECIMAL`. The value is always in **major** currency units (250.00 TL, 10.00 USD); provider adapters own each provider's wire encoding, so a column that really stores kurus or cents is charged 100x. The type **propagates to the request parameters bound to the column** (a create or update parameter with the column's name, or one a `dataClauseItems` entry writes verbatim as `this.<param>`): a numeric parameter (`Integer`, `Short`, `Double`, `Float`) is rewritten to `Decimal` by validation and reported as an auto-fix, a non-numeric one is a warning (`DECIMAL_PARAM_TYPE_MISMATCH`), and a `dataExample` with more fractional digits than the column keeps is rewritten to the value at scale (a non-numeric example is `DECIMAL_PARAM_EXAMPLE_NOT_NUMERIC`). The *scale* stays on the column, which is the only place that stores anything; a `Decimal` parameter is rounded to its column's scale (or to 2 when it writes no Decimal column) right after its `transform` runs.

> **Staged type.** A `Decimal` column is currently *stored* as a double-precision number, and the boundary rounding above is what keeps it exact-looking. Exact storage (PostgreSQL `NUMERIC`, MongoDB `Decimal128`), exact hydration and decimal arithmetic in expressions are planned under the same declaration, so no blueprint change will be needed. Until then, arithmetic *between* boundaries is still binary floating point, and a value read back from the Elasticsearch projection can carry the float's tail.

### `Float`

4-byte single-precision float. PostgreSQL `FLOAT`; MongoDB number.

### `Boolean`

`true` or `false`. PostgreSQL `BOOLEAN`; MongoDB boolean.

### `Date`

Date-time. PostgreSQL `TIMESTAMP WITH TIME ZONE`; MongoDB date. Use `defaultValue` literals like `"2024-01-01T00:00:00Z"`, or compute via a `dataClauseItems` MScript entry like `"new Date()"` for write-time stamps. For a database-native "now" default, use `defaultFn: "now"` (valid on `Date` only).

A required scalar Date with no authored default receives the current time when each row or document is built. The default is applied per insert, so it does not bake the service start time into a PostgreSQL column default. An authored fixed date remains fixed. The explicit `defaultFn: "now"` behaviour is unchanged.

### `Enum`

A fixed set of string values. Requires `enumOptions: ["a","b","c"]` (minimum two entries):

```json
{
  "basicSettings": {
    "name": "status",
    "type": "Enum",
    "enumOptions": ["draft", "published", "archived"],
    "defaultValue": "draft"
  }
}
```

Enum options are data, not code identifiers: the value is stored verbatim and compared verbatim in MScript, so reserved words of a programming language (`public`, `default`, `class`) are legal option values. Write the value you want stored and use exactly that spelling in MScript.

The column is a plain short string (PostgreSQL `VARCHAR(255)`, MongoDB string). The declared vocabulary is checked when an api writes the property, but the storage adds no database-level constraint of its own, so the vocabulary alone does not reject other strings written around the generated service. State machines build on this; see [Lifecycle and state](lifecycle-and-state.md).

### `Object`

A structured JSON object for flexible structured payloads. PostgreSQL stores it as `JSONB`; MongoDB stores it as a mixed-type subdocument. Use it when the shape varies per row; when the shape is fixed and you need to query or relate it independently, prefer a dedicated relation. For a list of objects, see [Object[] (array of objects)](#object-array-of-objects).

### `GeoPoint`

A point on Earth as a GeoJSON `POINT` with `[longitude, latitude]` coordinates. PostgreSQL stores it as `GEOGRAPHY(POINT, 4326)` (automatically spatially indexed); MongoDB stores it as a GeoJSON `{ type: "Point", coordinates: [...] }` subdocument indexed with `2dsphere`.

```json
{ "basicSettings": { "name": "location", "type": "GeoPoint", "isRequired": true } }
```

See [Geography](geography.md).

### `GeoRoute`

A path as a GeoJSON `LINESTRING` (array of `[lon, lat]` pairs). PostgreSQL `GEOGRAPHY(LINESTRING, 4326)`; MongoDB a GeoJSON `LineString` subdocument with a `2dsphere` index.

### `GeoArea`

A polygon as a GeoJSON `POLYGON`. The last and first vertex must be equal (closed ring); if not, the service closes it automatically. The first ring is the outer boundary; every further ring is a hole cut out of it (see [Geography features](../capabilities/geography-features.md#geojson-format-in-and-out)). PostgreSQL `GEOGRAPHY(POLYGON, 4326)`; MongoDB a GeoJSON `Polygon` subdocument with a `2dsphere` index.

### `Blob`

Binary large object: `BYTEA` in PostgreSQL, a binary buffer in MongoDB. Used internally by [DB buckets](../composition/db-buckets.md) for in-database file content; rarely declared by hand. Does not support `isArray`.

## Common modifiers

All set on `basicSettings`:

| Flag | Effect |
|------|--------|
| `isRequired` | NOT NULL at the column or field level: the persisted row may not hold null here. It does *not* decide whether the caller must supply the value; that is a per-API `requestParameters[].required` decision. A value may reach the column from a request binding, a session inject, a static join, or a `defaultValue`. The schema default is `false` (nullable); state it explicitly on every property, because validation reports `IS_REQUIRED_UNSPECIFIED` while the key is missing. |
| `requirementCheck` | Conditional requiredness: an MScript condition over the record; while it holds, an empty value of this property is refused with `400 PROPERTY_REQUIRED_BY_CONDITION`. The column stays nullable. See [Conditional requiredness](#conditional-requiredness-requirementcheck). |
| `isArray` | Stores a typed array: a native PostgreSQL array (`type[]`) or a native MongoDB array. Honoured on most scalar types and, as a list of geometries, on the geo types (see [Geography](geography.md#geo-property-types)); not on `Blob`. See [Array properties](#array-properties). |
| `allowUpdate` | `true` (default): freely updatable. `false`: immutable after create; the update path drops the column from its write set, and an update `dataClauseItems` entry naming it is refused at design time (`DATA_CLAUSE_ITEM_NOT_EMITTED`). `'untilSet'`: **write-once**. The write is guarded with `WHERE <column> IS NULL`, so the first write after create wins atomically at the database and a later one is refused with a typed `WRITE_ONCE_ALREADY_SET` (409) instead of silently doing nothing. The guard applies to every update helper (by id, by id list, and by query, which is the one every `updateCrudAction` uses): a bulk or query-scoped write that matches a row already holding the value is refused whole, and each loser of a concurrent first write gets the same 409. A create that lands on an existing row (the upsert of an `onDuplicate: doUpdate` index, or a bulk create over an id that exists) never overwrites a set write-once column: a replay carrying the same value is an idempotent no-op on it, a different value (null included) is refused with the same `WRITE_ONCE_ALREADY_SET` (409) before anything is written (a bulk create refuses the whole batch), and a column that is still null is filled. Use `'untilSet'` for a value computable only after the row exists and never afterwards changeable: a capture-time commission snapshot, a settlement reference, an issued document number. It is accepted only on a **nullable** column (`isRequired: false`): the guard is `IS NULL`, so on a NOT NULL column it would refuse every update including the first (`WRITE_ONCE_REQUIRES_NULLABLE`). |
| `autoIncrement` | A database sequence numbers the column. Honoured on a scalar `Integer` or `Short` property (dropped on any other type, never on an array). On a PostgreSQL service whose compiler supports it the column is a `SERIAL`: an insert that does not carry a value gets the next number, so a required autoIncrement column needs no `dataClauseItems` entry. The column gets no fabricated `0` default, and an authored `defaultValue` beside the flag is dropped from the generated model (`AUTOINCREMENT_DEFAULT_IGNORED` warning): a default would be written on every insert and the sequence would never run. On MongoDB, or where a compiler emits no sequence, the flag has no effect and the column needs a value source like any other. |
| `maxLength` | `String` only: the n of the `VARCHAR(n)` column (255 when absent), checked before every model write with a field-named `422 VALIDATION_ERROR`. See [`String`](#string). |
| `hashed` | Value hashed before storage (for example passwords). Irreversible. |
| `isSecret` | Cleartext storage; scrubbed from outgoing responses, events and streamed chunks. A Business API may expose an eligible column in its own response with `apiOptions.exposeSecrets`; events stay scrubbed. |
| `defaultName` | Marks this property as the human-readable label for the row in UIs and relation dropdowns. Only one per object. |
| `isFilterParameter` | Exposes the property as a query-string filter on list APIs. |

## Conditional requiredness (`requirementCheck`)

`isRequired` makes a column NOT NULL for every row. A property that is required only in some rows takes a
`requirementCheck` instead: an MScript condition over the record. For example, `clinicId` is required when `roleId`
is `clinicManager` or `receptionist`, and optional for every other role. While the condition holds, an **empty**
value of the property is refused with `400` and the error code `PROPERTY_REQUIRED_BY_CONDITION`, naming the
property. Empty is `null`, a missing value, `''` and `[]`; `0` and `false` are values. The column stays nullable.

```json
{
  "basicSettings": {
    "name": "clinicId",
    "type": "ID",
    "isRequired": false,
    "requirementCheck": { "js": "['clinicManager', 'receptionist'].includes(this.roleId)" }
  }
}
```

The same works on an auth `userProperties` entry, where `this.roleId` is the user's role (the example above), so a
rule like "a clinic manager belongs to a clinic" holds on the built-in user APIs too.

- **Every write path.** The rule belongs to the data object, not to an API: it holds on built-in and custom create
  and update APIs, on create, update and bulk-create CRUD actions, on library functions and edge controllers that
  write through the data layer, and on seed data. A bulk create is refused whole before its first write.
- **What `this` is.** The record as it will be stored. On a create, the payload over the declared `defaultValue` of
  the columns the condition reads (a create that omits `roleId` is judged with its default). On an update, the
  stored row overlaid with the patch, so an update that changes only the condition field (`roleId` to
  `clinicManager`) is refused while `clinicId` is still empty, and so is an update that empties `clinicId` while the
  condition holds.
- **When an update is judged.** Only when the write carries the property itself or a column the condition reads.
  An update of other columns cannot change the answer, so it is not judged (a row stored before the condition was
  added stays writable).
- **Concurrent writes.** An update by id is applied compare-and-set: the stored values of the columns the condition
  read join the update's condition, so a concurrent writer that changed one of them first makes the update re-read
  the row and judge it again (after three lost races the update answers `409 REQUIREMENT_CHECK_CONFLICT`). Updates
  by id list or by query judge every matched row before their one statement.
- **What the condition may read.** Only `this.<property>` of the same data object, as a pure expression: no `LIB`,
  `API`, `session`, request or api context, no `await`, no assignment, no computed `this[...]`. It runs where those
  do not exist (a seed or an event-driven update has no request). Validation refuses an unknown column
  (`REQUIREMENT_CHECK_UNKNOWN_FIELD`) and an impure expression (`REQUIREMENT_CHECK_NOT_PURE`), and warns when the
  property is already `isRequired: true` (`REQUIREMENT_CHECK_ON_REQUIRED`: the condition adds nothing to a NOT NULL
  column).

A rule that depends on the caller (who may send what) is a validation action of the API instead; on the built-in
auth APIs that is
[`authentication.builtInApiChecks`](../system-services/authentication/users.md#rules-on-the-built-in-user-apis-builtinapichecks).

## Default values

Two paths: one scalar DB default, one expression path.

- **`basicSettings.defaultValue`**: a **scalar literal** DB default. PostgreSQL enforces it as a `DEFAULT` clause; MongoDB as a schema default. It must match the property's `type` and `isArray`. Use it for static literals only (`"pending"`, `0`, `false`). Removing a default reaches an existing database too: where the service reconciles its PostgreSQL schema at boot, a live column `DEFAULT` that the model no longer declares is dropped when the column is **nullable**. A property that was once required (and so carried the factory default `0`) and is now optional stops storing `0` on a create that omits it, and stores `NULL`. Existing rows are not touched, and a required column keeps its live default.
- **Per-API `query.dataClauseItems`**: an MScript expression on the relevant create or update API. Use it for computed defaults, server-stamped timestamps (`new Date()`), library-derived values (`LIB.common.md5(...)`), and any value that varies per API or is forced regardless of caller input.

For a forced value (for example always set `status: 'pending'` on every create), use a `dataClauseItems` entry with `value: { "js": "'pending'" }`, not `defaultValue`.

## How a Property value is populated

A property declares its DB shape, but *where its value comes from* at write time follows a small, explicit model. Two paths are automatic (activated on the property); everything else is a per-API decision.

1. **Automatic: session binding.** Populate [`sessionSettings`](../../spec/PropertySessionSettings.md) (set `sessionParam`). The service injects `session[sessionParam]` into the column at write time; it is not declared in any API's `requestParameters` or `dataClauseItems`. Use for `userId`, the tenant id, audit columns. `isOwnerField: true` marks the ownership field.
2. **Automatic: static join.** Populate [`staticJoin`](../../spec/PropertyStaticJoin.md) (set `jointSource`). At create time the service resolves the value from another data object (matching `jointForeignKey` to `jointSourceKey`, reading `jointRead`) and stores it statically; an update never re-resolves it. The lookup runs after the per-API dataClause writes and only fills a column the dataClause left null. See [Static joins](../composition/static-joins.md#which-write-paths-resolve-a-static-join) for the write paths that resolve it.
3. **Everything else: per-API in `dataClauseItems`.** Client-supplied values (HTTP body, query, path, header) flow in via the create or update [BusinessApi](../business-apis/overview.md)'s `requestParameters` and are mapped through `query.dataClauseItems[]`. Forced literals (`"'pending'"`) and computed values (`new Date()`, `LIB.<fn>(...)`) are `dataClauseItems` entries directly. The value source for these is decided **per API**, not on the property.
4. **DB-level scalar default: `basicSettings.defaultValue`.** Applies when none of the above supplies a value. Static literals only; dynamic defaults belong in `dataClauseItems`.
5. **Automatic: a decision.** Populate [`decisionSource`](../../spec/PropertyDecisionSource.md). A decision provider answers one typed question about the written row and the service stores the answer with its confidence, model and time. Such a property has no other value source: it may not be required, defaulted, session-bound or a static join. See [Decided properties](#decided-properties-decisionsource).

`sessionSettings` and `staticJoin` are mutually exclusive on one property. This is the bridge to the explicit API model: properties declare DB shape plus the two auto-binding hooks; the source of value for everything else is a per-API `dataClauseItems` decision. See [Business APIs overview](../business-apis/overview.md).

## Computed properties

A property whose value is derived at write time is written via an MScript expression in `query.dataClauseItems` on the relevant create or update API:

```json
{
  "name": "fullName",
  "value": { "js": "`${this.firstName} ${this.lastName}`" }
}
```

`this` is the **BusinessApi runtime context**, not the data-object row. The context accumulates request parameters (`this.<param>`), session (`this.session.*`), and the outputs of earlier workflow actions (`this.<contextPropertyName>`).

A property of the object is on the context only if it was **either** declared as a `requestParameters` entry **or** written to the context by an earlier action or step. A bare property is *not* automatically present on `this` just because it belongs to the object.

Calculation is general: you can reference other fetched objects. For example `this.customer.id` works **provided** you arranged that object to be fetched earlier in the workflow (for example a [`FetchObjectAction`](../../spec/FetchObjectAction.md) with `contextPropertyName: "customer"`) so it lands on the context **before** the dataClause runs. The dataClause MScript can read values placed on `this` by earlier-milestone actions. On create, session-bound columns are populated during dataClause construction; static joins resolve after the per-API dataClause writes, so a dataClause expression cannot read a value produced by that join. An explicit entry for the joined column wins, and the join only fills it if the entry leaves it null. Updates do not re-resolve static joins.

Values are evaluated at **write** time and persisted; reads return the stored value without re-running the script. For values that must reflect the freshest state of *other* records, prefer a [data view](../system-services/bff.md) over a computed property.

For values that should ride every request automatically (owner ids, tenant ids, audit columns), use `sessionSettings` or a `staticJoin` so the value is injected once at the property level instead of repeated on every API.

See [MScript syntax](../mscript/syntax.md).

## Decided properties (`decisionSource`)

When the value is a **judgement** no expression can compute (the category of a product from its description, the priority of a support ticket, whether a listing needs review), declare a `decisionSource` on the property instead of writing it per API. A [decision provider](../capabilities/decision-layer.md) answers one typed question about the row on every create, and on every update that writes a property the judgement depends on:

```json
{
  "basicSettings": { "name": "priority", "type": "Enum", "enumOptions": ["urgent", "normal", "other"] },
  "decisionSource": {
    "providerName": "mainJev",
    "state": { "js": "({ subject: this.subject, body: this.body })" },
    "question": {
      "name": "priority",
      "type": "choice",
      "instructions": "How quickly this support ticket needs a human.",
      "criteria": [
        { "name": "urgent", "value": "something is broken for a customer right now" },
        { "name": "normal", "value": "a question or a request" },
        { "name": "other", "value": "none of these" }
      ]
    },
    "confidenceThreshold": 0.8
  }
}
```

- Unlike a computed `dataClauseItems` value, `this` in `state` is the **row** as written, not the API context.
- The type must fit the question: `noul` needs `Boolean`, `choice` needs `Enum` (holding every option key) or `String`, `score` needs `Double`, `Float`, `Integer` or `Short`.
- Four companion columns are added: `<prop>DecisionConfidence`, `<prop>DecidedBy` (the model version, or `manual`), `<prop>DecidedAt` and `<prop>DecisionOverridden`. Do not declare properties with those names.
- A low-confidence answer leaves the value null with the companions filled; a provider outage leaves the row undecided and a background backfill decides it later. The write itself never fails.
- A value written through an update API is a manual correction that later recomputes leave alone.
- It may not sit on a property any authorization check reads, and a compiler may support it for only some target languages.

The lifecycle, the backfill and the validation codes are in [The decision layer](../capabilities/decision-layer.md#decisionsource-write-time-columns).

## Array properties

`basicSettings.isArray: true` makes a supporting type a typed array.

- **Storage is native in both engines.** PostgreSQL stores a scalar array as a native typed array (`type[]`); MongoDB stores a native array on the field. (The exception is `Object[]`; see below.)
- **Type support.** Most scalar types support `isArray`. **`Blob` does not.** A geo property (`GeoPoint`, `GeoRoute`, `GeoArea`) with `isArray: true` holds a list of its geometry type and is stored as one multi-geometry column rather than a native array (see [Geography](geography.md#geo-property-types)).
- **Defaults and empty arrays.** Without a value, an array property persists as an empty array (or `null` if not required). A scalar `defaultValue` for an array must itself be an array literal matching the element type.
- **Mutation.** Array updates use the array-mutation operators (`$push`, `$pull`, `$set`) in the create or update workflow; see [Array mutation](../mscript/array-mutation.md).
- **Filtering and indexing.** A `String[]` or other scalar array can be indexed (PostgreSQL uses a GIN index for array columns; MongoDB indexes the array natively) and filtered as a multi-value field when `indexedInDb` / `indexedInElastic` is set.

### `Object[]` (array of objects)

`type: "Object"` with `isArray: true` is a supported, first-class shape: an **array of structured objects**.

```json
{
  "basicSettings": {
    "name": "lineItems",
    "type": "Object",
    "isArray": true,
    "description": "Embedded order line items."
  }
}
```

A sample stored value:

```json
[
  { "sku": "ABC-1", "qty": 2, "unitPrice": 9.99 },
  { "sku": "XYZ-9", "qty": 1, "unitPrice": 24.0 }
]
```

- **Physical storage.** In **PostgreSQL** an `Object[]` is stored as a single **`JSONB`** column (not a native array column): the whole list is one JSON document. In **MongoDB** it is a native array of subdocuments.
- **Upper-level semantics.** Regardless of physical storage, at the API and runtime level it is treated and expected as **an array of objects**: you read and write real arrays of objects, and the service serializes and deserializes accordingly.
- **`Object[]` vs a child relation.** Use `Object[]` for embedded, per-row structured lists you do **not** query or relate independently. Use a child DataObject and a relation when the items need their own identity, their own querying, or relations of their own. See [Relations](relations.md).

## Changing the type of a stored property

When a SQL service reconciles its schema at boot in a development-style deployment, it compares each table with the model. It changes a column type only when the change **cannot lose data**:

- `ID` to `String` or `Text`, and a `String` to a longer one (a larger `maxLength`) or to `Text`. A smaller `maxLength` is a narrowing: it is reported and not applied, so values already stored are kept;
- `Short` to `Integer`, and either to a larger integer column;
- `Short` or `Integer` to `Double`, `Float` or `Decimal`. A `Decimal` is stored as a double today, see above. A move to an exact numeric column is applied when the column is unbounded or keeps every integer digit.

Every other type change is **not applied**. Examples: `Double` to `Integer`, a 64-bit integer to `Double` (large values would round), `String` to `Integer`. The column keeps its old type, the service reports `schema change pending migration`, and writes of values that only the new type accepts fail until the column changes. Where schema changes ship only as migrations (staged or production-style deployments), no column type changes at boot; the change is a migration. One change is the exception, and the next section describes it. A raised String `maxLength` is a gap in the migration path today: no migration is generated for it, so the column has to be widened by hand (see [`String`](#string)).

Some changes have no single cast that keeps the rows (for example an `ID` to `Integer`, or a change to or from an array). A compiler may offer a review of the statement and of the rows a cast would refuse or alter; see [the compiler specification](../../compiler/index.md). After such a review, rebuilding the database from the blueprint takes the change, and its rows are not kept.

## Changing a stored property into an array

Setting `isArray` on a property that already has rows changes its PostgreSQL column from a scalar to an array, for example `varchar` to `varchar[]`. PostgreSQL has no cast between the two, so the service cannot read or write the column through the new model until the column changes. The service therefore applies this change itself when it boots, in **every** deployment kind:

- Each stored value becomes an array with that one value. `NULL` stays `NULL`. A `NOT NULL` column stays `NOT NULL`.
- The change is applied only when the element type stays the same: `String` to `String[]`, `Enum` to `Enum[]`, `Text` to `Text[]`, `ID` to `ID[]`, `Integer` to `Integer[]`, and likewise `Short`, `Boolean`, `Date`, `Double`, `Float` and `Decimal`. A `String` may also become a `Text[]`.
- The column default is replaced. A scalar default cannot stay on an array column, so the service drops it and sets the default the property now declares, if it declares one.
- A plain index and a unique index on the column are rebuilt and keep working. A unique index now compares whole arrays.

Each column is changed in one transaction. If PostgreSQL refuses the change, the column, its default and its rows stay exactly as they were. Causes include an index on an expression over the column, a partial index whose condition reads the column, a foreign key, and a table lock that the service could not get within 5 seconds. The service still starts, reports the failed repair on its health surface, and tries again on the next boot.

What the service does **not** apply, and reports as `schema change pending migration`:

- An array back to a scalar. The service cannot choose which element to keep.
- A change of the element type together with the dimension, for example `Integer` to `String[]` or `ID` to `String[]`.
- `Object` to `Object[]`. A stored object may already hold a list, and wrapping it would nest that list.
- A primary key, or a column that a sequence fills.

Three limits to plan for:

- **Values written while the column was still scalar are wrapped as they are.** If a service with the array model already ran against the scalar column, it stored array values as their text form, for example `{"user"}`. After the change such a row holds the one-element array `['{"user"}']`. The service does not repair these rows. Correct them by hand.
- **The change rewrites the table** and holds an exclusive lock on it while it does. On a large table, deploy at a quiet time.
- **A build from before the change cannot use the column afterwards.** Its writes of a plain value fail. Replace every instance of the service.

MongoDB needs no change: a stored scalar reads as a one-element array. MySQL, SQL Server and SQLite have no array columns, so the service never applies this change there.

## See also

- [Data objects](data-objects.md): the container.
- [Relations](relations.md): foreign keys via `relationSettings` block presence.
- [Indexes](indexes.md): DB, Elasticsearch and Redis index settings.
- [Geography](geography.md): `GeoPoint`, `GeoRoute`, `GeoArea`.
- [Remote buckets](../composition/remote-buckets.md), [DB buckets](../composition/db-buckets.md): file storage (does not use a `File` property type).
- [Db layer](db-layer.md): how a property compiles into each engine's model.
- [MScript syntax](../mscript/syntax.md), [Array mutation](../mscript/array-mutation.md).
- Specification: [`DataProperty`](../../spec/DataProperty.md), [`PropertyBasicSettings`](../../spec/PropertyBasicSettings.md), [`PropertySessionSettings`](../../spec/PropertySessionSettings.md), [`PropertyStaticJoin`](../../spec/PropertyStaticJoin.md).
