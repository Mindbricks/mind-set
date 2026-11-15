# HTTPRequestParameters

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [HTTPRequestParameters in Part 1](../ontology/HTTPRequestParameters.md)

Defines the parameters to be sent with an HTTP request. This includes data sent in the request body, query string, headers, or cookies. All item names here are WIRE names: they are sent verbatim on the request (never camelCase-normalized).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `httpRequestBody` | [`WireKeyMapItem`](./WireKeyMapItem.md)[] | no |  |  |  | Key-value pairs to include in the body of the request. Keys are emitted verbatim as JSON body keys (e.g. `customer_id` stays `customer_id`). |
| `httpRequestQuery` | [`WireKeyMapItem`](./WireKeyMapItem.md)[] | no |  |  |  | Key-value pairs to include as query string parameters. Names are emitted verbatim (URL-encoded) into the query string (e.g. `filter[status]`). |
| `httpRequestHeaders` | [`WireTokenMapItem`](./WireTokenMapItem.md)[] | no |  |  |  | Custom headers to include in the request. Header names are wire tokens sent verbatim (e.g. `x-api-key` stays `x-api-key`, NOT camelCased). |
| `httpRequestCookies` | [`WireTokenMapItem`](./WireTokenMapItem.md)[] | no |  |  |  | Cookies to be attached to the request. Cookie names are wire tokens sent verbatim in the Cookie header. |

## Constraints

Property rules:

- The items of `httpRequestBody` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `httpRequestQuery` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `httpRequestHeaders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `httpRequestCookies` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
