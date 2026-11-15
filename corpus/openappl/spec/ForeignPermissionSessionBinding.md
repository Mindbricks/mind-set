# ForeignPermissionSessionBinding

**Level:** `section` · **Family:** [ForeignPermissionProvider](../ontology/families.md#foreignpermissionprovider) (domain `ProjectAuthentication`)

**Ontology:** [ForeignPermissionSessionBinding in Part 1](../ontology/ForeignPermissionSessionBinding.md)

**Name:** an instance is named by `from`.

One session-field → request-PLACEMENT binding. The gate pulls `this.session.<from>` (the caller's application JWT is reachable as `accessToken`) and PLACES it on the permission request per `in`: into the bearer token, a request header, the JSON body, or a query param — under key `<as>` (ignored for `bearer`, which is always `Authorization: Bearer <value>`).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `from` | `String` | yes |  |  |  | The session field to read (e.g. `userId`, `email`, `accessToken`, `tenantId`). |
| `in` | `ForeignPermissionBindingIn` | no | `"body"` | `bearer`, `header`, `body`, `query` |  | WHERE the resolved value is PLACED on the permission request: `bearer` (sent as `Authorization: Bearer <value>` — REST header / gRPC `metadata.authorization`; `as` IGNORED), `header` (a REST request header / gRPC metadata entry named `<as>`), `body` (a JSON body field / gRPC proto message field `<as>` — DEFAULT, alongside the per-api params) or `query` (a REST query-string param `<as>`; IGNORED for grpc). Existing `{from,as}` configs default to `body`, unchanged. |
| `as` | `String` | no |  |  |  | The header-name / body-key / query-key the value is placed under (e.g. `userToken` for a server that wants the JWT in a `userToken` body field, or `perm-user-id` for a header). IGNORED when `in` is `bearer` (the value is always `Authorization: Bearer <value>`). |

## Constraints

Property rules:

- `from` must be present. (`REQUIRED_FIELD_MISSING`)
- `in` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
