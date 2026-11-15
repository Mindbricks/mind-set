# ServiceLibrary

**Level:** `chapter` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [ServiceLibrary in Part 2](../spec/ServiceLibrary.md)

Defines a custom service library for your OpenAPPL service. A ServiceLibrary is a modular container for user-defined code, templates, and assets. It allows developers to inject business-specific logic or reusable components into the service. You can define functions, templates, and assets, as well as edge functions (used by edge controllers to fully control the route lifecycle). These modules can be referenced throughout the service—for example, in validations, permissions, conditions, or hooks. The `hooks[]` partition additionally binds a `functions[]` entry to the service lifecycle itself: a `startup` hook runs on every boot (after db/kafka wiring, before traffic is served; idempotent by contract), a `shutdown` hook runs best-effort on graceful shutdown.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `LIB` | global `LIB` in every code slot | The service library registry: `LIB.<moduleName>(...)` calls a `library.functions[]` module of this service from any code slot. | nodejs, java, dotnet, python |

## Contained in

- [Service](./Service.md) as `library`

Blueprint paths:

- `services.library`

## Contains

- `functions`: [LibModule](./LibModule.md), a list
- `nativeKernels`: [NativeKernel](./NativeKernel.md), a list
- `wasmModules`: [WasmModule](./WasmModule.md), a list
- `calculations`: [Calculation](./Calculation.md), a list
- `edgeFunctions`: [LibModule](./LibModule.md), a list
- `templates`: [LibModule](./LibModule.md), a list
- `assets`: [LibModule](./LibModule.md), a list
- `public`: [LibModule](./LibModule.md), a list
- `pdfTemplates`: [PdfTemplate](./PdfTemplate.md), a list
- `hooks`: [ServiceHook](./ServiceHook.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
