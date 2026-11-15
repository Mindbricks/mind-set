# LibModuleBody

**Level:** `subsection` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [LibModuleBody in Part 1](../ontology/LibModuleBody.md)

Multi-language body of a `LibModule` — one optional body per language/format key. Code keys (`js`, `ts`, `csharp`, `python`, `rust`, `go`, `php`, `java`) match the MScript compiler set plus js/ts for the nodejs reference; the generated service emits the body matching its target language natively (nodejs prefers `ts` then `js`). Asset/format keys (`html`, `txt`, `svg`, `ejs`, `json`) are language-agnostic — the key is the file extension. All keys are optional `Text`; the key itself names the body's language/extension (there is no separate `moduleExtension`).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `js` | `Text` | no |  |  |  | JavaScript body (nodejs reference; CommonJS `module.exports`). Emitted as `.js`. Export contract: the module's export IS the callable — `module.exports = function <name>(...) {...}`; the generated LIB registry `require`s the file and registers that export under the moduleName with no `.default` interop, so an ES `export default` or named `export` is NOT callable through it. |
| `ts` | `Text` | no |  |  |  | TypeScript body (nodejs reference, preferred over `js` for nodejs services). Emitted as `.ts`. Export contract: the module's CommonJS export IS the callable - `module.exports = function <name>(...) {...}` or the TypeScript `export = function <name>(...) {...}`, which compiles to the same `module.exports` assignment. The generated LIB registry and the edge adapter bind the bare `require(...)` result with no `.default` interop, so an `export default` or a named `export function <name>` body binds the module namespace instead of the function and the call throws `is not a function`. |
| `csharp` | `Text` | no |  |  |  | C# body for dotnet services. Emitted as `.cs`. Export contract: a global-namespace `public static class <PascalCase(moduleName)>` exposing `public static object? Invoke(params object?[] args)` — compiled `LIB.<name>(...)` lowers to `<Pascal>.Invoke(...)`. |
| `python` | `Text` | no |  |  |  | Python body for python services. Emitted as `.py`. Export contract: a top-level `def <moduleName>(...)` — the generated LIB registry imports it by name (`from .functions.<name> import <name>`). |
| `rust` | `Text` | no |  |  |  | Rust body for rust services. Emitted as `.rs`. Export contract: a `pub fn <snake_case(moduleName)>(...)` with its own natural signature — compiled `LIB.<name>(...)` lowers to `crate::lib_layer::<snake>(...)` with positional value-mode args. |
| `go` | `Text` | no |  |  |  | Go body for golang services. Emitted as `.go`. Export contract: an exported `func <PascalCase(moduleName)>(...)` — registry.go registers it BY NAME into the commons MScript LIB registry (the generic `func(args ...any) any` ABI dispatches directly; a natural signature dispatches via reflection with JS-style arg semantics). |
| `php` | `Text` | no |  |  |  | PHP body for php services. Emitted as `.php`. Export contract: a standalone global-namespace file — optional `<?php` prologue + `function <moduleName>(...)` — emitted verbatim under `app/ProjectLib/functions/`; the generated `Lib::<name>` method delegates to the global `\<name>(...)`. ARCHIVED: the php service lane was retired on 2026-07-31 (frozen) and php is no longer a selectable service language, so this key is never emitted by an active target. Kept so existing bodies round-trip unchanged. |
| `java` | `Text` | no |  |  |  | Java body for java services. Emitted as `.java`. Export contract: a standalone `public final class <PascalCase(moduleName)>` exposing a static `invoke(...)` — emitted verbatim as `lib/<Pascal>.java`; the Lib registry delegates through a reflection adapter (String/Number arg coercion, missing args zero-fill). |
| `html` | `Text` | no |  |  |  | HTML asset body (language-agnostic). Emitted as `.html`. |
| `txt` | `Text` | no |  |  |  | Plain-text asset body (language-agnostic). Emitted as `.txt`. |
| `svg` | `Text` | no |  |  |  | SVG asset body (language-agnostic). Emitted as `.svg`. |
| `ejs` | `Text` | no |  |  |  | EJS template body (language-agnostic). Emitted as `.ejs`. |
| `json` | `Text` | no |  |  |  | JSON asset body (language-agnostic). Emitted as `.json`. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
