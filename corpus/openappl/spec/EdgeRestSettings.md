# EdgeRestSettings

**Level:** `section` · **Family:** [EdgeController](../ontology/families.md#edgecontroller) (domain `Service`)

**Ontology:** [EdgeRestSettings in Part 1](../ontology/EdgeRestSettings.md)

Defines the public REST endpoint for the edge controller. Specifies how the route is exposed via HTTP, including path and method.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `restEnabled` | `Boolean` | no | `true` |  |  | Set to true if you want your edge function to be called through its own REST API. Default is true. |
| `path` | `String` | no |  |  |  | The URL path for this controller, RELATIVE to the service's edge mount prefix ('/edge' by default, overridable per deployment with the EDGE_MOUNT_PATH environment variable). It determines where the edge function will be accessible in the REST API (e.g., '/generate-invoice', served at '/edge/generate-invoice'). Never repeat the mount prefix here. |
| `method` | `HTTPRequestMethods` | no | `"GET"` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |  | The HTTP method that will trigger the edge controller. Typical values include GET, POST, PUT, DELETE, etc. |

## Constraints

Property rules:

- `method` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
