# AiProviderResourceCredentialScope

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [AiProviderResourceCredentialScope in Part 2](../spec/AiProviderResourceCredentialScope.md)

The resource level of one AI provider entry's scoped credentials: which data object's rows may own a key, how the row is found from a call, and which member roles manage and use the key. Validation: `dataObject` must name a data object of the project whose `membershipSettings.hasMembership` is true with `membershipObjectName`, `membershipObjectIdProperty` and `membershipUserIdProperty` set (an owner field alone is the user level, not this one); `managers` and `users` must be roles the membership role field can carry (the `rolePermissions` roles, the role property's enum options, or the built-in `member` of a roleless membership), compared case-insensitively; with `managers` empty the object needs an owner field (`sessionSettings.isOwnerField`), because only the creator could ever set a key; `idFrom` is required unless `mode` is `off` and must be a property path of `params` or `session`; one data object name may be resource-scoped in one service only, because a key's owner is `<object>:<row id>`; `budget.dailyCostCeilingUsd` must be a positive number; the brand must support scoped keys (google, azure-openai, bedrock, ollama and mock cannot take this level; fal and custom warn that saved keys are stored unverified); and an AgentHarness with `modelSettings.auth: userSubscription` may not use an entry whose resource mode is not `off`.

## Contained in

- [AiProviderCredentialScopes](./AiProviderCredentialScopes.md) as `resource`

## Contains

- `budget`: [AiProviderResourceCredentialBudget](./AiProviderResourceCredentialBudget.md)

## References

- `dataObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
