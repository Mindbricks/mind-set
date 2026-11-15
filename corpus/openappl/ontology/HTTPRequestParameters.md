# HTTPRequestParameters

**Level:** `subsection` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [HTTPRequestParameters in Part 2](../spec/HTTPRequestParameters.md)

Defines the parameters to be sent with an HTTP request. This includes data sent in the request body, query string, headers, or cookies. All item names here are WIRE names: they are sent verbatim on the request (never camelCase-normalized).

## Contained in

- [HTTPRequest](./HTTPRequest.md) as `httpRequestParameters`

## Contains

- `httpRequestBody`: [WireKeyMapItem](./WireKeyMapItem.md), a list
- `httpRequestQuery`: [WireKeyMapItem](./WireKeyMapItem.md), a list
- `httpRequestHeaders`: [WireTokenMapItem](./WireTokenMapItem.md), a list
- `httpRequestCookies`: [WireTokenMapItem](./WireTokenMapItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
