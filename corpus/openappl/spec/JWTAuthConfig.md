# JWTAuthConfig

**Level:** `subsection` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [JWTAuthConfig in Part 1](../ontology/JWTAuthConfig.md)

Defines the configuration details for JWT-based authentication. This object is used when useJWTForAuthentication is set to true. It includes token and key refresh periods.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `tokenPeriodInDays` | `Integer` | no | `30` |  |  | Specifies the lifespan of each JWT token, in days. After this period, the token will expire and require reauthentication. |
| `sessionCookieMaxAgeDays` | `Integer` | no |  |  |  | How long the browser session COOKIE is allowed to live, in days. Leave it unset and the cookie follows tokenPeriodInDays, which is what you want unless you have a reason to diverge. Set it to let the cookie expire sooner than the token: the token and its server-side session stay valid for tokenPeriodInDays, the browser simply stops sending the cookie earlier. The generated service emits this as the SESSION_COOKIE_MAX_AGE_MS environment variable in MILLISECONDS (days multiplied by 86400000), and the runtime hands the browser the SMALLER of that ceiling and the token's own expiry, so a value LARGER than tokenPeriodInDays extends nothing. Must be a positive number of days when set. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
