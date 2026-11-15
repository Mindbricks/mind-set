# WireTokenMapItem

**Level:** `subsection` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [WireTokenMapItem in Part 2](../spec/WireTokenMapItem.md)

A key-value pair whose name is a WIRE-PROTOCOL token (HTTP header or cookie name). The name is preserved VERBATIM — never renamed or camelCase-normalized (never-silently-rename policy) — and must match the RFC 7230 token charset. The value is defined using an MScript.

## Contained in

- [HTTPRequestParameters](./HTTPRequestParameters.md) as `httpRequestHeaders` (a list)
- [HTTPRequestParameters](./HTTPRequestParameters.md) as `httpRequestCookies` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
