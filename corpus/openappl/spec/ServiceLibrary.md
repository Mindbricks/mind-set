# ServiceLibrary

**Level:** `chapter` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [ServiceLibrary in Part 1](../ontology/ServiceLibrary.md)

Defines a custom service library for your OpenAPPL service. A ServiceLibrary is a modular container for user-defined code, templates, and assets. It allows developers to inject business-specific logic or reusable components into the service. You can define functions, templates, and assets, as well as edge functions (used by edge controllers to fully control the route lifecycle). These modules can be referenced throughout the service—for example, in validations, permissions, conditions, or hooks. The `hooks[]` partition additionally binds a `functions[]` entry to the service lifecycle itself: a `startup` hook runs on every boot (after db/kafka wiring, before traffic is served; idempotent by contract), a `shutdown` hook runs best-effort on graceful shutdown.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `LIB` | global `LIB` in every code slot | The service library registry: `LIB.<moduleName>(...)` calls a `library.functions[]` module of this service from any code slot. | nodejs, java, dotnet, python |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `functions` | [`LibModule`](./LibModule.md)[] | no |  |  |  | List of reusable library functions available in the service. These are general-purpose functions used in validations, permissions, and other scripts. Each function is defined as a `LibModule` whose `moduleBody` is multi-language — one body per language key (`js`, `ts`, `python`, `csharp`, `go`, `rust`, `java`, `php`); the generated service emits the body matching its target language. Every language body must follow that language's export contract (documented per key on `LibModuleBody`). For the `js` body this means DIRECTLY assigning the callable — `module.exports = function (...) {...}` (an arrow function or a reference to a function declared in the module also works); named exports (`exports.myFn = ...`, `module.exports = { myFn }`) are rejected because the generated LIB registry `require`s the module and registers its export as the callable. |
| `nativeKernels` | [`NativeKernel`](./NativeKernel.md)[] | no |  |  |  | List of native (C++/C) compute kernels exposed to the service as library functions. A `NativeKernel` wraps an existing native library (e.g. CUDA/MKL/OpenCV/a proprietary HPC routine) behind a stable `extern "C"` shim and is compiled and linked into the consuming service via FFI — not bridged. Kernels are referenced from MScript exactly like ordinary library functions (`LIB.computeShippingBatch(...)`). Unlike a `functions` module (which runs from the target-native `moduleBody` key and is never bridged; a missing key emits a failing stub), a kernel is native code linked directly into the consuming binary. Use kernels only when a project must link a specific C/C++ library that has no native equivalent in the service's language; prefer ordinary `functions` authored in the service language otherwise. See `docs/ADR-cpp-kernel-native-lib.md`. |
| `wasmModules` | [`WasmModule`](./WasmModule.md)[] | no |  |  |  | Portable WebAssembly modules exposed to the service as library functions. Unlike a `NativeKernel` (native C/C++ linked via FFI, compute hosts only), a `WasmModule` carries a precompiled, sandboxed, toolchain-free `.wasm` binary whose exported functions become callable library functions. |
| `calculations` | [`Calculation`](./Calculation.md)[] | no |  |  |  | List of curated compute primitives (the Tier-1 `Calculation` substrate of docs/ADR-calculation-layer.md §1/§5). Each `Calculation` is a single curated math operation over a crate/package (FFT a buffer, k-means an array, group-by a dataframe), called from MScript like a library function (`LIB.fft(this.signal)`) and answered within the call — synchronously or off-thread — for small/bounded math that belongs in a request. For anything heavy or long-running, declare a `ComputeJob` on the service instead. Only valid on rust/python host services (the calculation languages); a codegen error otherwise. |
| `edgeFunctions` | [`LibModule`](./LibModule.md)[] | no |  |  |  | Functions invoked by edge controllers, enabling fully custom handling of requests. These modules must export an async function that accepts a single request parameter and returns an API response or throws an error. Standard validations will still apply before execution. An edge function is called by an edge controller defined in the service's edgeControllers. An edge controller can be triggered by a REST request, a Kafka message, or a cron scheduler. The request parameter format varies by trigger type: (1) REST: the Express.js request object with body, query, params, and session; (2) Kafka: a message object where the JSON body contains the created, deleted, or updated resource data directly accessible on the request (e.g., request.product), along with session when there is a current user login in the context; (3) Cron: an empty object {}. The session object is attached to REST and Kafka triggers when there is a current user login in the context. Example: `{ 'moduleName': 'helloWorld', 'moduleBody': { 'js': 'module.exports = async (request) => { return { status: 200, message: "Hello from the edge function", date: new Date().toISOString() }; }' } }` |
| `templates` | [`LibModule`](./LibModule.md)[] | no |  |  |  | Templates used within the service to render dynamic content such as emails, documents, or downloads. Typically written in `ejs`, they are evaluated with route data before rendering the final output. |
| `assets` | [`LibModule`](./LibModule.md)[] | no |  |  |  | Static text or image-based files (e.g., credentials, configs, illustrations) used by the business logic. These can be used internally or for generating downloadable content. Each is defined as a `LibModule`. |
| `public` | [`LibModule`](./LibModule.md)[] | no |  |  |  | Public files exposed via a static URL, accessible directly by frontend or client-side apps. Text-formatted assets only: an item's `moduleBody` carries plain TEXT under one of the declared `LibModuleBody` keys (typically `html`, `txt`, `svg`, `ejs`, or `json`) — never base64. `svg` is the only image format carried, so vector assets such as logos live here as SVG text. Binary assets (PNG, JPEG, PDF, fonts) are NOT library items — `LibModuleBody` has no key for them — and will be served by a separate designtime bucket. |
| `pdfTemplates` | [`PdfTemplate`](./PdfTemplate.md)[] | no |  |  |  | PDF templates used by RenderPdfAction. Each is a PdfTemplate (EJS body + page setup + optional header/footer + metadata) rendered to PDF via the service's pdf-layer. |
| `hooks` | [`ServiceHook`](./ServiceHook.md)[] | no |  |  |  | Service lifecycle hooks: run a declared library function automatically when the service starts (trigger `startup`) or gracefully stops (trigger `shutdown`). Each hook references a `functions[]` entry of THIS service's library by `moduleName`. RUN-EVERY-BOOT semantics with an IDEMPOTENCY CONTRACT: a startup hook runs on EVERY boot of the service — there is NO persisted run-once marker — so the referenced function MUST be idempotent (safe to repeat on every restart, rolling deploy and crash recovery: use upserts, existence checks or version stamps, never blind inserts). The generated bootstrap awaits startup hooks AFTER the database, migrations, seed data and kafka wiring are up and BEFORE the HTTP listener binds; each hook is try/caught and logged — a hook that throws NEVER blocks the health endpoint and never crashes boot (the service comes up degraded, with the failure in the boot log). A startup hook that exceeds its boot budget (`LIBRARY_STARTUP_HOOK_BUDGET_MS`, default 30000 ms) stops being awaited: boot proceeds and the hook keeps running in the background. Shutdown hooks run best-effort on the graceful-shutdown path (SIGTERM/SIGINT) under `LIBRARY_SHUTDOWN_HOOK_BUDGET_MS` (default 10000 ms); a killed process runs nothing, so never rely on a shutdown hook for correctness. The hook function is invoked with no arguments and may be async; it reaches the db-layer and sibling services exactly like any other library function. |

## Constraints

Property rules:

- The items of `functions` must have distinct names (`moduleName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `nativeKernels` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `wasmModules` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `calculations` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `edgeFunctions` must have distinct names (`moduleName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `templates` must have distinct names (`moduleName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `assets` must have distinct names (`moduleName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `public` must have distinct names (`moduleName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `pdfTemplates` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `hooks` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `EMPTY_MODULE_BODY` | error | … "…" has empty or invalid module body |
| `HOOK_MODULE_NOT_FOUND` | error | Hook "…" references library function "…", but no functions[] entry with that moduleName exists in this service's library. |
| `LIB_DBLAYER_ACCESSOR_UNDEFINED` | warning | … "…" … (line …, column …) |
| `LIB_DBLAYER_FIELD_UNKNOWN` | warning | … "…" … (line …, column …) |
| `LIB_STUB_REFERENCED` | warning | Library function "…" is a no-op stub (…) but businessLogic calls `LIB.…` — every call site silently receives the stub value at runtime. |
| `NO_EXPORT` | error | … "…" must directly assign a function: module.exports = function (...) {...} (an arrow function or a reference to a function declared in this module also works). |
| `PARSE_ERROR` | error | … "…" has invalid JavaScript syntax: … |
