# StreamSourceConfig

**Level:** `subsection` · **Family:** [BusinessApiControllers](./families.md#businessapicontrollers) (domain `BusinessApi`)

**Specification:** [StreamSourceConfig in Part 2](../spec/StreamSourceConfig.md)

Reserved: not read by the code generator yet. Describes a custom source of chunked SSE data (lib function, iterator action, SSE or WebSocket relay), but no generated SSE route reads it in any service language, so declaring it has no effect; the schema only validates its shape so stored blueprints stay valid. To stream custom items, schedule an `IteratorAction` in the workflow instead.

## Contained in

- [ApiSseSettings](./ApiSseSettings.md) as `streamSource`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
