# AuthHttpSettings

**Level:** `section` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [AuthHttpSettings in Part 1](../ontology/AuthHttpSettings.md)

Defines the HTTP configuration of the auth service. Primarily includes the port on which the auth service will accept HTTP requests.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `httpPort` | `Integer` | no | `3011` |  |  | The port number that the auth service will use to listen for HTTP traffic. Recommended to use ports in the 3000-3099 range for consistency across microservices. |
| `routerSuffix` | `String` | no |  |  | format [urlPath](./value-formats.md#urlpath) | Retained deployment-path setting. Node.js currently does not consume it to rewrite the auth-service URL before Express routing. Leading-prefix versus trailing-suffix matching, segment boundaries, non-match behavior, query preservation and auth/service precedence require a ruling. Leave null. |

## Constraints

Property rules:

- `routerSuffix` must be in the [`urlPath`](./value-formats.md#urlpath) format. (`INVALID_URL_PATH`)
