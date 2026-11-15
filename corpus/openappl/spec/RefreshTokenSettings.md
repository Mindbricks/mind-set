# RefreshTokenSettings

**Level:** `section` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [RefreshTokenSettings in Part 1](../ontology/RefreshTokenSettings.md)

**Activation:** the pattern is switched on by `useRefreshToken`.

Configures opt-in refresh tokens for the auth service. A refresh token is an opaque random string whose SHA-256 hash is stored server-side (never the token itself), so it is revocable — logout can genuinely kill it, which a stateless refresh JWT cannot. Each refresh token is single-use: presenting it at `/relogin` mints a successor and retires the presented one, so a retired token showing up again is evidence of theft and revokes the whole token family issued from that login.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useRefreshToken` | `Boolean` | no | `false` |  |  | Enable refresh tokens. When true, every login response carries a `refreshToken` alongside the access token (the password login, a social login through `/auth/social-login-result` and the register auto-login), and `/relogin` accepts either credential. When false (default) no refresh token is issued and `/relogin` accepts only a still-valid access token. |
| `refreshTokenTTLDays` | `Integer` | no | `30` |  |  | How many days a refresh token stays valid, counted from the moment it is issued. It should comfortably outlive the access token — that is the point of the mechanism. Default 30. |
| `rotationGraceSeconds` | `Integer` | no | `60` |  |  | Seconds a just-retired refresh token is still accepted after rotation. This exists for one specific failure: if the `/relogin` response is lost in flight (dropped connection, app killed mid-request) the server has already rotated but the client never received the successor, so an honest retry presents a retired token and would otherwise be treated as theft and log the user out. The window makes that retry succeed while keeping the replay window small. Default 60. Overridable at runtime with REFRESH_TOKEN_GRACE_SECONDS. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
