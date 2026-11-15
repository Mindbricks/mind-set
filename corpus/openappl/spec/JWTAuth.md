# JWTAuth

**Level:** `section` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [JWTAuth in Part 1](../ontology/JWTAuth.md)

**Activation:** the pattern is switched on by `useJWTForAuthentication`.

Defines the configuration for JWT-based authentication, where the project issues and verifies its own JSON Web Tokens. This is the recommended authentication method in OpenAPPL due to its stateless nature and scalability.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useJWTForAuthentication` | `Boolean` | no | `true` |  |  | Enables project JWT user-token session resolution, default true. On nodejs, explicit false skips the user JWT verifier at the generated REST, gRPC and socket session-resolution doors. API-key admission remains available when separately enabled; internal-event session resolution also retains its existing path. This switch does not disable service-identity M2M authentication or remove login/token-mint APIs. |
| `configuration` | [`JWTAuthConfig`](./JWTAuthConfig.md) | no |  |  |  | The configuration object for JWT authentication. Leave it null if useJWTForAuthentication is false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
