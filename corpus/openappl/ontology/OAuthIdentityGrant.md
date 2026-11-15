# OAuthIdentityGrant

**Level:** `section` · **Family:** [OAuthFlow](./families.md#oauthflow) (domain `Service`)

**Specification:** [OAuthIdentityGrant in Part 2](../spec/OAuthIdentityGrant.md)

A single identity grant on an OAuthFlow: the provider VERIFIES `identity` (a user verification column) when `condition` (a JS expression over the normalized OAuth `profile`) is truthy. Applied by the OAuth runtime at login and registration to mark identities verified server-side.

## Contained in

- [OAuthFlow](./OAuthFlow.md) as `grants` (a list)

Blueprint paths:

- `services.oauthFlows.grants`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
