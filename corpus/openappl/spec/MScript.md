# MScript

**Level:** `unclassified` · **Family:** [Standalone patterns](../ontology/families.md#standalone-patterns)

**Ontology:** [MScript in Part 1](../ontology/MScript.md)

Represents an OpenAPPL expression used for logic, validation, or configuration. Canonically an MScript is a **multilanguage object** — a per-language source map keyed by target language (`js`, `ts`, `python`, `go`, `java`, `csharp`, `php`, `rust`). Author the expression directly in one or more target languages, and/or supply a `js` source: codegen TRANSLATES the `js` form into the five languages that ship a translator — `java`, `python`, `csharp` (dotnet), `go` (golang) and `rust` — which is what makes a `js`-only MScript portable across service languages. Two keys are NOT translation targets: `ts` is linted but read by no compile target (the nodejs lane resolves `js` only), so a `ts`-only MScript is dead weight — neither run as-is nor translated; and `php` still has a translator but belongs to the frozen lane that is no longer reachable from a design. Each source must be a valid expression in its language; the `js`/`ts` source conforms to a JavaScript ExpressionStatement (a literal, identifier, expression, function call, or a `module.exports` assignment returning a valid object). A compile target prefers its own language's source when present and otherwise falls back to translating the `js` form; an MScript that offers a service's language neither its own source nor a `js` source is REFUSED at design time (`MSCRIPT_NO_SOURCE_FOR_TARGET_LANGUAGE`) rather than silently dropped from the generated service. The legacy plain-string form (a bare JS expression string) is deprecated: it is auto-migrated to `{ "js": "<expr>" }` by the legacy project migrator and rejected for new authoring. MScripts are parsed and analyzed by a specialized override class (`custom/MScript.ts`) that provides static checks and per-language compilation. This is the same `schema == code, per-language object` shape as `LibModuleBody`.

EMPTY vs AUTHORED. An MScript slot is EMPTY when no language source carries a non-blank string: `null`, the empty or whitespace-only string, `{}`, and the ALL-NULL envelope design tools scaffold for an untouched field (`{ "js": null, "ts": null, ... }`) all mean "nothing authored here". A slot declared `required` therefore reports `REQUIRED_FIELD_MISSING` for every one of those shapes, including the scaffold - which is a plain object, so truthiness used to call it authored and a design saved straight from the design tool's template validated as complete while the emitted action ran an empty script. A value of a shape an MScript slot cannot hold (a number, a boolean, an array, an envelope with a non-string source) is an `INVALID_FIELD_TYPE`, not a missing value.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `LIB` | global `LIB` in every code slot | The service library registry: `LIB.<moduleName>(...)` calls a `library.functions[]` module of this service from any code slot. | nodejs, java, dotnet, python |
| `API` | global `API` in every code slot | The internal-call registry: `API.<apiName>(params)` runs a business API of this service in process, from any code slot. Only an api that sets `controllers.internalCallSettings.hasInternalCallController` is on the registry. | nodejs, java, dotnet, python |
| `runMScript` | bare `runMScript` in MScript slots and action bodies; `const { runMScript } = require("common")` | The diagnostic envelope generated code evaluates MScript in. It relabels errors only; it is not a sandbox (code runs with full service privileges). | nodejs |
| `hashPassword` | `this.hashPassword(...)` in MScript slots and action bodies | `this.hashPassword(plain)` resolves a bcrypt hash (cost 10). Async: awaited when it is the whole slot expression, otherwise write the `await` yourself. | nodejs |
| `hashCompare` | `this.hashCompare(...)` in MScript slots and action bodies | `this.hashCompare(plain, hashed)` resolves `true` when `plain` matches the bcrypt hash; a stored value that is not a bcrypt hash answers `false`. Async, like `hashPassword`. | nodejs |
| `doCheckPermission` | `this.doCheckPermission(...)` in MScript slots and action bodies | `this.doCheckPermission(permissionName, objectId?)` resolves whether the session holds the permission. Async. | nodejs |
| `doCheckMembership` | `this.doCheckMembership(...)` in MScript slots and action bodies | `this.doCheckMembership(dataObjectName, objectKey, userKey, requiredRoles)` resolves whether the user has a membership row (with one of the roles, when given) on the object. Async. | nodejs |
| `getMembershipOf<Object>` | `this.getMembershipOf<Object>(...)` in MScript slots and action bodies | Generated per object with `membershipSettings.hasMembership`: `this.getMembershipOf<Object>(userKey, ...)` resolves the user's membership row on one object (cached) or `null`. Async. | nodejs |
| `collectMembershipOf<Object>` | `this.collectMembershipOf<Object>(...)` in MScript slots and action bodies | Generated per object with `membershipSettings.hasMembership`: `this.collectMembershipOf<Object>(userKey)` resolves every membership row of the user. Async. | nodejs |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `js` | `Text` | no |  |  |  | JavaScript expression source — the reference form, and the only portable one. The nodejs lane consumes it directly; for every other service language codegen TRANSLATES it into that language — `java`, `python`, `csharp` (dotnet), `go` (golang), `rust` — whenever that language has no dedicated source below. `ts` is not a translation target, so `js` (never `ts`) is what makes an MScript portable. |
| `ts` | `Text` | no |  |  |  | TypeScript expression source. Read by NO compile target today: the nodejs lane resolves the `js` source only, and no translator consumes `ts`. A `ts`-only MScript is dead weight — linted for syntax, then never emitted and never translated, and refused at design time. Author `js` for nodejs services. |
| `python` | `Text` | no |  |  |  | Python-native expression source for python services. |
| `go` | `Text` | no |  |  |  | Go-native expression source for golang services. |
| `java` | `Text` | no |  |  |  | Java-native expression source for java services. |
| `csharp` | `Text` | no |  |  |  | C#-native expression source for dotnet services. |
| `php` | `Text` | no |  |  |  | PHP-native expression source for php services. Frozen lane — a PHP translator still exists but the lane is no longer reachable from a design. ARCHIVED: the php service lane was retired on 2026-07-31 (frozen) and php is no longer a selectable service language, so this key is never read by an active target. Kept so existing sources round-trip unchanged. |
| `rust` | `Text` | no |  |  |  | Rust-native expression source for rust services. |

## Constraints

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DOTNET_NATIVE_LIB_CONTAINER_UNSUPPORTED` | warning | Native C# manager LIB is object? |
| `INTERNAL_API_LANE_UNSUPPORTED` | warning | API in a JS-authored .NET MScript still lowers to Ms.InternalApi, which throws NotSupportedException at the call. |
| `INTERNAL_API_NAME_CASE_MISMATCH` | error | MScript calls `API.…` but this service's BusinessApi is declared as "…" — the names differ only in CASE (at line …, column …). |
| `INTERNAL_API_NO_CONTROLLER` | error | MScript calls `API.…` but BusinessApi "…" does not declare an internal call controller (at line …, column …) — it is not a member of `API`, so at runtime the call throws. |
| `INTERNAL_API_NOT_FOUND` | error | MScript calls `API.…` but this service declares no BusinessApi named "…" (at line …, column …). |
| `INVALID_FIELD_TYPE` | error | MScript source "…" must be a string or null (got …). |
| `INVALID_MSCRIPT_SYNTAX` | error | Invalid MScript syntax [ts]: … |
| `LIB_BARE_FUNCTION_MEMBER_ACCESS` | warning | MScript reads `LIB.….…` but module "…" exports a bare function (at line …, column …) — it has no "…" member, so the read evaluates to `undefined` at runtime.… Call it directly (`LIB.…(...)`), or attach the member to the … |
| `LIB_DBLAYER_RAW_WHERE_USES_MQUERY` | error | MScript … (at line …, column …) |
| `LIB_MODULE_NOT_FOUND` | warning | MScript calls `LIB.…` but the service library declares no functions[] module, native kernel, or wasm export named "…" (at line …, column …). |
| `LIB_PROPERTY_NOT_FOUND` | warning | MScript reads `LIB.….…` but module "…" exports no member named "…" (at line …, column …) — the read evaluates to `undefined` at runtime. |
| `MSCRIPT_API_COMPUTED_ACCESS` | warning | MScript reaches the internal-call registry through a COMPUTED member access `API[…]` (at line …, column …). |
| `MSCRIPT_ASYNC_API_NOT_AWAITED` | error | MScript calls `…` without `await` and then … (at line …, column …). |
| `MSCRIPT_BARE_IDENTIFIER` | warning | MScript expression is a bare identifier "…". |
| `MSCRIPT_CSHARP_PARSER_UNAVAILABLE` | warning | Real C# parser unavailable: …. |
| `MSCRIPT_DBLAYER_ACCESSOR_UNDEFINED` | warning | MScript … (at line …, column …) |
| `MSCRIPT_ENUM_LITERAL_CASE` | warning | MScript compares … against "…", which matches enum option "…" only by case (at line …, column …). |
| `MSCRIPT_ENUM_LITERAL_UNKNOWN` | error |  |
| `MSCRIPT_FETCHED_PROPERTY_UNKNOWN` | warning | MScript reads `this.….…` but "…" is not a property of data object "…" bound to `this.…` (at line …, column …). |
| `MSCRIPT_FLAT_INSTANCE_FIELD_READ` | error | MScript reads `this.…` flat, but "…" is a property of data object "…" and instance fields are never bound flat on the api context (at line …, column …). |
| `MSCRIPT_INTERSERVICE_RESULT_PROPERTY_UNKNOWN` | warning | MScript reads `this.….…` but "…" is neither a property of "…" (the data object of API "…" on service "…") nor a call-result envelope field (at line …, column …). |
| `MSCRIPT_LEGACY_STRING_FORM` | error | MScript is authored as a bare string — the deprecated single-language form. |
| `MSCRIPT_LIB_CALL_IN_SYNC_CALLBACK` | warning | MScript tests the result of `LIB.…(…)` (`…`, at line …, column …) inside a non-async callback. |
| `MSCRIPT_LIB_RESULT_VAR_NOT_AWAITED` | warning | MScript stores the un-awaited result of `LIB.…(…)` in `…` and then reads `…` as a value (…, at line …, column …). |
| `MSCRIPT_MQUERY_FIELD_NOT_IN_VIEW` | warning | MQuery filter names "…", which stored DataView "…" does not carry. |
| `MSCRIPT_MQUERY_UNKNOWN_COLUMN` | error | MQuery filter names "…", a column of the related object reached through relation "…" of data object "…" (at line …, column …). |
| `MSCRIPT_NO_SOURCE_FOR_TARGET_LANGUAGE` | error | MScript carries no source this service's language can read. |
| `MSCRIPT_NOT_AN_EXPRESSION` | error | …… Parse error: … |
| `MSCRIPT_NULLABLE_INSTANCE_UNGUARDED_DEREF` | warning | MScript reads `this.….…` without a null guard (at line …, column …), but this … api declares onNotFound: 'complete', so the manager reaches its … slot with `this.…` = null whenever no row matches — the read evaluates to … |
| `MSCRIPT_NULLABLE_MEMBER_UNGUARDED` | warning |  |
| `MSCRIPT_PARAMETER_BARE_THIS` | error | MScript reads a bare `this` in a requestParameter … (at line …, column …). |
| `MSCRIPT_READ_GATE_NULL_DATA` | warning | Hint: MScript reads `….…` without optional chaining in a READ authorization script (at line …, column …). |
| `MSCRIPT_SOURCE_SYNTAX_SUSPECT` | warning | MScript … source looks syntactically broken: …. |
| `MSCRIPT_THIS_ID_UNBOUND` | error, warning | MScript reads `this.id` (at line …, column …) with a fallback to `this.…`. |
| `MSCRIPT_UNDECLARED_REFERENCE` | warning | MScript reads `this.…` but no parameter, action contextPropertyName, or framework-bound name with that key is declared on this BusinessApi (at line …, column …). |
| `MSCRIPT_UNKNOWN_CONTEXT_FIELD` | warning | MScript reads `this.…` but the bucket … authorization context has no "…" field (at line …, column …) — the read is always `undefined`, so the comparison can never match and the script silently denies. |
| `MSCRIPT_UNKNOWN_ROOT_BINDING` | error | MScript root identifier "…" is not available in the … slot — available bindings: …. |
| `MSCRIPT_UNKNOWN_SOURCE_KEY` | error | Unknown MScript source language "…". |
| `OPAQUE_LIB_ASYNC_UNKNOWN` | warning | MScript calls `LIB.…(…)` without `await` and then … (at line …, column …). |
| `SESSION_FIELD_UNKNOWN` | warning | MScript reads `this.session.…` but "…" is not a known session field (at line …, column …) — neither a framework-stamped field nor an auth user property of this project. |
