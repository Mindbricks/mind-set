# MScript

**Level:** `unclassified` · **Family:** [Standalone patterns](./families.md#standalone-patterns)

**Specification:** [MScript in Part 2](../spec/MScript.md)

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

## Contained in

No property of another pattern holds this pattern.

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
