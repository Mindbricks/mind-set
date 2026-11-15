# RefreshTokenSettings

**Level:** `section` · **Family:** [AuthBasics](./families.md#authbasics) (domain `ProjectAuthentication`)

**Specification:** [RefreshTokenSettings in Part 2](../spec/RefreshTokenSettings.md)

Configures opt-in refresh tokens for the auth service. A refresh token is an opaque random string whose SHA-256 hash is stored server-side (never the token itself), so it is revocable — logout can genuinely kill it, which a stateless refresh JWT cannot. Each refresh token is single-use: presenting it at `/relogin` mints a successor and retires the presented one, so a retired token showing up again is evidence of theft and revokes the whole token family issued from that login.

## Contained in

- [AuthBasics](./AuthBasics.md) as `refreshTokenSettings`

Blueprint paths:

- `authentication.authenticationEssentials.refreshTokenSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
