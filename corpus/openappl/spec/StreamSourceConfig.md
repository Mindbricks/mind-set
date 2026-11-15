# StreamSourceConfig

**Level:** `subsection` · **Family:** [BusinessApiControllers](../ontology/families.md#businessapicontrollers) (domain `BusinessApi`)

**Ontology:** [StreamSourceConfig in Part 1](../ontology/StreamSourceConfig.md)

Reserved: not read by the code generator yet. Describes a custom source of chunked SSE data (lib function, iterator action, SSE or WebSocket relay), but no generated SSE route reads it in any service language, so declaring it has no effect; the schema only validates its shape so stored blueprints stay valid. To stream custom items, schedule an `IteratorAction` in the workflow instead.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `sourceType` | `StreamSourceType` | yes |  | `libFunction`, `iteratorAction`, `sseRelay`, `wsRelay` |  | Reserved, not read by the code generator yet. The intended kind of stream source: libFunction (async generator), iteratorAction (declared pattern), sseRelay (external SSE), wsRelay (external WebSocket). Validation only checks the enum value. |
| `libFunctionName` | `String` | no |  |  |  | Reserved source selector. Name intended to select a registered async-generator library function when sourceType is 'libFunction'. No generated Node.js SSE registry lookup or invocation consumes this name. Lookup scope, argument/context binding, errors and iteration/cancellation lifecycle require a ruling. Leave null. |
| `iteratorAction` | `String` | no |  |  |  | Reserved source selector. Name intended to select a declared IteratorAction when sourceType is 'iteratorAction'. No generated Node.js SSE source lookup resolves this name; use a workflow-scheduled IteratorAction for the existing yield/chunk execution path. Lookup scope, argument/context binding, errors and iteration/cancellation lifecycle require a ruling. Leave null. |
| `relayUrl` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Reserved for future SSE/WebSocket relay URL selection. No generated SSE controller connects to this URL or opens a relay connection from this setting. The generic /mscript-sample demo may select and execute this compiled expression when it passes the demo-scope splice check; that incidental value-return path does not implement a relay. Leave null. |
| `relayAuth` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Reserved for future relay authentication. No generated SSE controller evaluates this expression as a relay Authorization header or opens a relay connection from this setting. The generic /mscript-sample demo may select and execute this compiled expression when it passes the demo-scope splice check; that incidental value-return path does not implement a relay. Leave null. |

## Constraints

Property rules:

- `sourceType` must be present. (`REQUIRED_FIELD_MISSING`)
- `sourceType` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
