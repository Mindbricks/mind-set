# GrpcCallRequest

**Level:** `subsection` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [GrpcCallRequest in Part 2](../spec/GrpcCallRequest.md)

The request message for a `GrpcCallAction` — a list of proto-field-to-MScript mappings. Mirrors how ApiCallAction expresses its body: each field's value is compiled MScript evaluated against the API context at runtime and assigned to the named proto field of the gRPC Request message.

## Contained in

- [GrpcCallAction](./GrpcCallAction.md) as `request`

## Contains

- `fields`: [DataMapItem](./DataMapItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
