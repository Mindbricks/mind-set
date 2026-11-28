# LibModule

**Level:** `section` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [LibModule in Part 1](../ontology/LibModule.md)

**Name:** an instance is named by `moduleName`.

Defines a module file in the service library. This object is used for declaring code, templates, or file assets that enhance your business logic. A `LibModule` can be a code function (JavaScript/TypeScript/Python/C#/Go/Rust/Java/PHP), an HTML/EJS template, or a static text/image file.

A module body is **multi-language**: `moduleBody` is a `LibModuleBody` object whose keys carry one body per language/format. The key IS the file extension/language — there is no separate `moduleExtension` field. Code keys (`js`/`ts`/`python`/`csharp`/`go`/`rust`/`java`/`php`) are emitted natively in the generated service's target language; asset/format keys (`html`/`txt`/`svg`/`ejs`/`json`) are language-agnostic and emitted by their format key. When a service compiles to language X and a CODE function has no body for X's key, codegen emits a failing stub (throws/panics with a `TODO(lib)` message) plus a warning — the service still builds. The legacy single-body shape `{ moduleExtension, moduleBody: <string> }` is still accepted and normalized to `{ moduleBody: { <ext>: <string> } }` (default ext `js`).

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `LIB` | global `LIB` in every code slot | The service library registry: `LIB.<moduleName>(...)` calls a `library.functions[]` module of this service from any code slot. | nodejs, java, dotnet, python |
| `API` | global `API` in every code slot | The internal-call registry: `API.<apiName>(params)` runs a business API of this service in process, from any code slot. Only an api that sets `controllers.internalCallSettings.hasInternalCallController` is on the registry. | nodejs, java, dotnet, python |
| `ServicePublisher` | `const { ServicePublisher } = require("common")` | Publish a Kafka event from your code: `new ServicePublisher(topic, data, session, requestId)` then `await publisher.publish()`. Declare the topic in the module's `publishes` list so the producer census sees it. | nodejs |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `moduleName` | `String` | yes |  |  |  | The name of the module. Should be unique within the library. Use lowercase or camelCase (e.g., `updateParent`). This name is used to reference the function or file in route logic. |
| `moduleBody` | [`LibModuleBody`](./LibModuleBody.md) | yes |  |  |  | The content of the module, as a `LibModuleBody` — one body per language/format. The key is the language/extension (e.g. `js`, `ts`, `python`, `csharp`, `go`, `rust`, `java`, `php` for code; `html`, `txt`, `svg`, `ejs`, `json` for assets). At least one key should be set. The generated service picks the body matching its target language (nodejs prefers `ts` then `js`); a missing code body for the target language yields a failing stub + codegen warning. Asset/format modules use the format key directly. The legacy form (a string with a sibling `moduleExtension`) is normalized into this object at load. |
| `publishes` | `String`[] | no |  |  |  | Kafka topics this code module publishes, declared so the project's producer census counts them as produced. Only meaningful on a `library.functions[]` or `library.edgeFunctions[]` module. The census cannot see a publish made from designer code (a `new ServicePublisher(topic, ...)` in the body, whose topic is usually composed at run time), so without a declaration a subscription to that topic reads as producerless: the generated service logs `KafkaSubscriptionsWithoutProducer` at ERROR at boot, and design time reports `KAFKA_TOPIC_NO_PRODUCER` for a consumer in the same project. Name each topic as it goes on the wire. A topic in a service's framework namespace carries the project codename, exactly as the framework's own events do: `<projectCodename>-<serviceName>-service-<event>` (e.g. `acme-commerce-service-issueddocument-requested`). A designer-authored topic (`billing.document.requested`) is written as authored. A framework-namespace name without the codename (`commerce-service-issueddocument-requested`) and a name Kafka refuses are design-time errors that name the fix. A declaration does not publish anything: the body still does, and a declared topic the body never publishes only hides a dead subscription. A lifecycle hook that publishes by calling this function (`LIB.<moduleName>(...)`) is covered by this list; code that is not a library module declares on the service-level `serviceOptions.publishes` instead. |

## Constraints

Property rules:

- `moduleName`, `moduleBody` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DECLARED_PUBLISH_ON_NON_CODE_MODULE` | warning | LibModule "…" declares published topics, but it is not a code module: only library `functions[]` and `edgeFunctions[]` publish, and the kafka producer census reads the declaration there alone. |
| `DOTNET_LIB_INVOKE_METADATA_INVALID` | error | lib '…': … |
| `DOTNET_LIB_INVOKE_METADATA_MISSING` | warning |  |
| `LIB_EXPORT_CONTRACT` | warning | lib '…': expected … for the Python LIB registry. |
| `LIB_UNNAMESPACED_ELASTIC_INDEX` | error |  |
