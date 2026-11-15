# GrpcCallRequest

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [GrpcCallRequest in Part 1](../ontology/GrpcCallRequest.md)

The request message for a `GrpcCallAction` — a list of proto-field-to-MScript mappings. Mirrors how ApiCallAction expresses its body: each field's value is compiled MScript evaluated against the API context at runtime and assigned to the named proto field of the gRPC Request message.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `fields` | [`DataMapItem`](./DataMapItem.md)[] | no |  |  |  | The proto Request fields to send. Each entry maps a proto field name to an MScript expression. Fields whose value evaluates to undefined are still assigned (proto-loader applies defaults); omit a field by not listing it. |

## Constraints

Property rules:

- The items of `fields` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
