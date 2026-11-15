# ApiCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [ApiCallAction in Part 2](../spec/ApiCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Calls an external or internal HTTP API during Business API execution. This is ideal for integrating with third-party services or internal utility endpoints. The fetched result is stored in context and optionally written to the response. Input and output transformation are supported.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `apiCallActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.apiCallActions`
- `services.businessLogic.actions.apiCallActions`

## Contains

- `apiCallRequest`: [HTTPRequest](./HTTPRequest.md)
- `httpRequestPath`: [WireKeyMapItem](./WireKeyMapItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
