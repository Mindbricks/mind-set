# CookieSettings

**Level:** `section` · **Family:** [AuthBasics](./families.md#authbasics) (domain `ProjectAuthentication`)

**Specification:** [CookieSettings in Part 2](../spec/CookieSettings.md)

Arranges the allow-list for the session cookie. The cookie itself is always httpOnly; Secure and SameSite come from the runtime env (COOKIE_SECURE, SESSION_COOKIE_SAMESITE). This section decides two things: which hosts may receive the cookie at all, and what its Domain attribute is.

## Contained in

- [AuthBasics](./AuthBasics.md) as `cookieSettings`

Blueprint paths:

- `authentication.authenticationEssentials.cookieSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
