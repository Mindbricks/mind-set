# WasmExport

**Level:** `subsection` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [WasmExport in Part 1](../ontology/WasmExport.md)

**Name:** an instance is named by `name`.

One exported function of a `WasmModule`, surfaced to the service library as `LIB.<name>(...)`. Declares the export's `name`, its ordered typed `params`, and its `returns` type. The host binds exactly these exports; the value boundary is flat (Wasm value types plus host-marshalled `string`/`buffer`), so host objects never cross into the guest.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The exported Wasm function name. Must match an export the `.wasm` module actually provides, and is the identifier called from MScript as `LIB.<name>(...)`. Use camelCase (e.g. `add`, `sumF64`, `blurImage`). |
| `params` | [`WasmParam`](./WasmParam.md)[] | no |  |  |  | Ordered list of the export's parameters. Each is a `WasmParam` with a name and a Wasm value type (`i32`/`i64`/`f32`/`f64`, or host-marshalled `string`/`buffer`). For a `string`/`buffer` param the host allocates a region in the module's linear memory, copies the bytes in, and passes a (ptr, len) pair to the export per the marshalling contract. |
| `returns` | `WasmValueType` | no | `"i32"` | `i32`, `i64`, `f32`, `f64`, `string`, `buffer`, `void` |  | The Wasm value type the export produces (`i32`/`i64`/`f32`/`f64`, or host-marshalled `string`/`buffer`/`void`). For a `string`/`buffer` return the export writes into a host-allocated out region (or returns a (ptr,len) the host reads from linear memory) per the marshalling contract. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `returns` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `params` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
