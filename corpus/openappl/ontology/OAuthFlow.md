# OAuthFlow

**Level:** `chapter` · **Family:** [OAuthFlow](./families.md#oauthflow) (domain `Service`)

**Specification:** [OAuthFlow in Part 2](../spec/OAuthFlow.md)

A declarative OAuth redirect flow hosted by the service. Each flow exposes its own REST start route (redirects the browser to the provider's authorize URL) and callback route (exchanges the code for a token and fetches the user's profile via the config-driven common OAuth runtime). On the auth service the callback completes the login (find-or-register the user + mint a session) and stashes a one-time `socialCode` result the portal exchanges; every flow also publishes its `completeKafkaTopic` completion event so other services can react. Replaces the hand-written social-login router. Provider credentials come from env (e.g. GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET; Apple uses TEAM_ID/KEY_ID/PRIVATE_KEY for its ES256 client secret).

## Contained in

- [Service](./Service.md) as `oauthFlows` (a list)

Blueprint paths:

- `services.oauthFlows`

## Contains

- `flowBasics`: [OAuthFlowBasics](./OAuthFlowBasics.md)
- `grants`: [OAuthIdentityGrant](./OAuthIdentityGrant.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
