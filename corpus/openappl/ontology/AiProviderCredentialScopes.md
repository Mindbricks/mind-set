# AiProviderCredentialScopes

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [AiProviderCredentialScopes in Part 2](../spec/AiProviderCredentialScopes.md)

Which credential levels below the application owner (saas) may supply the key for one AI provider entry, and who pays for calls made with those keys. Every scope is `off` by default, which keeps the entry exactly as it was. `optional` lets the tenant or user save a key that is used when present, with fallback to the next level. `required` means the level must have a key: a call without one fails with HTTP 428 and the code `AI_PROVIDER_CREDENTIAL_REQUIRED` (the problem body's `errorCode`, the mcpbff chat's `code`; the message names the provider and the scope) and the saas key is never used, so a frontend can ask the user to add their key. When a lower scope is `required` the saas key in `configuration` becomes optional and a BYOK-only project needs none. Validation: `tenant` must stay `off` in a single-tenant project (the chain there is saas then user); a scope cannot be enabled on a brand that does not support scoped keys; and on a brand without a cheap live check (fal, custom) a warning says saved keys will be stored as `unverified`. Covered callers on nodejs services: AI agents and each of their fallback providers, agentHub agents, AiCallAction, the mcpbff chat and AI completion, and the AgentHarness model gateway. Dotnet and java services cover AI agents (the primary and each fallback provider) and AiCallAction at the tenant and user levels, and golang services resolve the tenant and user levels; none of these three reads the resource level. Python and rust services cover AI agents (the primary and each fallback provider) and AiCallAction at the user, resource and tenant levels. Video-layer and content-layer AI calls always use the saas key. Kafka and cron runs have no user, so they resolve tenant then saas. Stored keys are sealed under the deploy secret `PROVIDER_CREDENTIAL_KEY`, which auth, the AI-calling services and the mcpbff must receive in every slot. The `resource` block adds a fourth level between the user and the tenant: a key owned by one row of a membership-bearing data object (a workspace), managed by the row's creator and the member roles named in `managers`, and used by the members named in `users`. The full order is user, then resource, then tenant, then saas; set `user` to `off` when the workspace key must win over a personal one. Like the other levels it is `off` by default, and an entry without it is unchanged.

## Contained in

- [AiProvider](./AiProvider.md) as `credentialScopes`

## Contains

- `resource`: [AiProviderResourceCredentialScope](./AiProviderResourceCredentialScope.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
