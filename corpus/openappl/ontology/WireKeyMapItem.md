# WireKeyMapItem

**Level:** `subsection` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [WireKeyMapItem in Part 2](../spec/WireKeyMapItem.md)

A key-value pair whose name is a WIRE key (URL query parameter name or JSON body key). The name is preserved VERBATIM — never renamed or camelCase-normalized (never-silently-rename policy) — and must be printable ASCII without spaces. The value is defined using an MScript.

## Contained in

- [ApiCallAction](./ApiCallAction.md) as `httpRequestPath` (a list)
- [HTTPRequestParameters](./HTTPRequestParameters.md) as `httpRequestBody` (a list)
- [HTTPRequestParameters](./HTTPRequestParameters.md) as `httpRequestQuery` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
