# KernelParam

**Level:** `subsection` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [KernelParam in Part 1](../ontology/KernelParam.md)

**Name:** an instance is named by `name`.

A single parameter of a `NativeKernel`. The value type is flat — a scalar, a numeric buffer, raw bytes, or a UTF-8 string — so it can cross the C ABI without host-object marshaling. For a buffer parameter the generated C signature passes a pointer plus an element count `n`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Parameter name, used both in the generated C signature and inside `shimBody`. Use camelCase or snake_case (e.g. `weights`, `zone`). |
| `type` | `KernelValueType` | yes |  | 11 values, see [KernelValueType](#kernelvaluetype) |  | The parameter's value type — a scalar (`f64`/`f32`/`i64`/`i32`/`bool`), a UTF-8 `string`, raw `bytes`, or a numeric buffer (`f64[]`/`f32[]`/`i64[]`/`i32[]`). |

## Allowed values

### KernelValueType

`f64`, `f32`, `i64`, `i32`, `bool`, `string`, `bytes`, `f64[]`, `f32[]`, `i64[]`, `i32[]`

## Constraints

Property rules:

- `name`, `type` must be present. (`REQUIRED_FIELD_MISSING`)
- `type` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
