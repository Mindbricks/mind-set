# WasmSource

**Level:** `subsection` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [WasmSource in Part 1](../ontology/WasmSource.md)

A fetchable reference to the `.wasm` binary (or `.wat` text) a `WasmModule` runs. Same fetch contract as `KernelSource`: designers work through the web and the AI agent, never a local filesystem, so the binary is uploaded to the platform bucket (preferred) or hosted at a URL/git remote, or carried inline (base64 `.wasm` / literal `.wat`). Codegen downloads it into the service's `wasm/` folder at generation time, verifying `sha256` for url/git origins.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `origin` | `WasmSourceOrigin` | yes |  | `bucket`, `url`, `git`, `inline` |  | Where the binary is fetched from. `bucket` (preferred) resolves `ref` as a key in the project's platform bucket — the file the user or AI agent uploaded; it stays inside the platform trust boundary. `url` fetches `ref` over HTTPS. `git` clones the `ref` remote. `inline` carries the content directly in `ref` (base64-encoded `.wasm` bytes, or — when `dest` ends in `.wat` — a literal WebAssembly text the codegen compiles to `.wasm`). |
| `ref` | `Text` | yes |  |  |  | The locator, interpreted per `origin`: a bucket object key, an HTTPS URL, a git remote (optionally `#ref`), or — when `origin` is `inline` — base64 `.wasm` bytes (default) or literal `.wat` text (when `dest` ends in `.wat`). |
| `dest` | `String` | yes |  |  |  | Relative path under the generated service's `wasm/` folder where the fetched binary is written (e.g. `imageOps.wasm`). When it ends in `.wat`, codegen compiles it to a sibling `.wasm` before instantiation. The host loads the module from this path. |
| `sha256` | `String` | no |  |  |  | Hex SHA-256 of the fetched bytes. Required for `url` and `git` origins — codegen verifies it after download and fails generation on mismatch, pinning the supply chain. Optional (but recommended) for `bucket`. |
| `base64` | `Boolean` | no | `false` |  |  | When true (and `origin` is `inline`), `ref` is interpreted as base64-encoded bytes that codegen decodes before writing to `dest`. Default false (raw `inline` text, e.g. a `.wat`). |

## Constraints

Property rules:

- `origin`, `ref`, `dest` must be present. (`REQUIRED_FIELD_MISSING`)
- `origin` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
