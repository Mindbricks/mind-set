# WasmParam

**Level:** `subsection` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [WasmParam in Part 1](../ontology/WasmParam.md)

**Name:** an instance is named by `name`.

A single parameter of a `WasmExport`. The value type is flat so it can cross the host↔guest boundary without host-object marshaling: a Wasm numeric value type (`i32`/`i64`/`f32`/`f64`), a host-marshalled UTF-8 `string`, or a numeric/byte `buffer`. For a `string`/`buffer` the host copies the bytes into the module's linear memory and passes a pointer + length pair to the export.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Parameter name, used in the generated host wrapper signature. Use camelCase (e.g. `a`, `values`, `text`). |
| `type` | `WasmValueType` | yes |  | `i32`, `i64`, `f32`, `f64`, `string`, `buffer`, `void` |  | The parameter's Wasm value type — a numeric value type (`i32`/`i64`/`f32`/`f64`), a UTF-8 `string`, or a `buffer` (raw/numeric bytes). `string`/`buffer` are host-marshalled through the module's linear memory. |

## Constraints

Property rules:

- `name`, `type` must be present. (`REQUIRED_FIELD_MISSING`)
- `type` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
