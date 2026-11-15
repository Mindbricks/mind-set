# LibModule

**Level:** `section` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [LibModule in Part 2](../spec/LibModule.md)

Defines a module file in the service library. This object is used for declaring code, templates, or file assets that enhance your business logic. A `LibModule` can be a code function (JavaScript/TypeScript/Python/C#/Go/Rust/Java/PHP), an HTML/EJS template, or a static text/image file.

A module body is **multi-language**: `moduleBody` is a `LibModuleBody` object whose keys carry one body per language/format. The key IS the file extension/language — there is no separate `moduleExtension` field. Code keys (`js`/`ts`/`python`/`csharp`/`go`/`rust`/`java`/`php`) are emitted natively in the generated service's target language; asset/format keys (`html`/`txt`/`svg`/`ejs`/`json`) are language-agnostic and emitted by their format key. When a service compiles to language X and a CODE function has no body for X's key, codegen emits a failing stub (throws/panics with a `TODO(lib)` message) plus a warning — the service still builds. The legacy single-body shape `{ moduleExtension, moduleBody: <string> }` is still accepted and normalized to `{ moduleBody: { <ext>: <string> } }` (default ext `js`).

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `LIB` | global `LIB` in every code slot | The service library registry: `LIB.<moduleName>(...)` calls a `library.functions[]` module of this service from any code slot. | nodejs, java, dotnet, python |
| `API` | global `API` in every code slot | The internal-call registry: `API.<apiName>(params)` runs a business API of this service in process, from any code slot. Only an api that sets `controllers.internalCallSettings.hasInternalCallController` is on the registry. | nodejs, java, dotnet, python |
| `ServicePublisher` | `const { ServicePublisher } = require("common")` | Publish a Kafka event from your code: `new ServicePublisher(topic, data, session, requestId)` then `await publisher.publish()`. Declare the topic in the module's `publishes` list so the producer census sees it. | nodejs |

## Contained in

- [ServiceLibrary](./ServiceLibrary.md) as `functions` (a list)
- [ServiceLibrary](./ServiceLibrary.md) as `edgeFunctions` (a list)
- [ServiceLibrary](./ServiceLibrary.md) as `templates` (a list)
- [ServiceLibrary](./ServiceLibrary.md) as `assets` (a list)
- [ServiceLibrary](./ServiceLibrary.md) as `public` (a list)

Blueprint paths:

- `services.library.functions`
- `services.library.edgeFunctions`
- `services.library.templates`
- `services.library.assets`
- `services.library.public`

## Contains

- `moduleBody`: [LibModuleBody](./LibModuleBody.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
