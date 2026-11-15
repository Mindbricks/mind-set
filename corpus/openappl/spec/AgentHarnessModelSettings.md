# AgentHarnessModelSettings

**Level:** `section` · **Family:** [AgentHarness](../ontology/families.md#agentharness) (domain `AgentHubConfig`)

**Ontology:** [AgentHarnessModelSettings in Part 1](../ontology/AgentHarnessModelSettings.md)

The model an AgentHarness runs on, and how the session authenticates to it. With `auth: providerKey` (the default) the runner's model gateway adds the provider key, so the key never enters the sandbox. With `auth: userSubscription` a Claude Code or Codex session runs on the session owner's own Claude or ChatGPT subscription, stored at the tenant or user level of the entry.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `providerName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of an AI provider entry in projectSettings.aiProvidersSettings.aiProviders[]. Its API shape must be one the runtime speaks: openai, xai, deepseek, moonshot, azure-openai and ollama entries are OpenAI-shaped; anthropic entries are Anthropic-shaped; a custom entry takes its shape from its apiFormat key (openai or anthropic). google, bedrock and the media providers cannot back a harness. With `auth: providerKey` only an API key through the entry (the application owner's, or a tenant's or user's own through `credentialScopes`) is used. With `auth: userSubscription` the entry names the vendor of the owner's subscription (`anthropic` for `claude-code`, `openai` for `codex`) and must enable the tenant or user scope; give a subscription harness a dedicated entry, because an owner holds one credential per entry (an API key or a subscription token). |
| `auth` | `AgentHarnessModelAuth` | no | `"providerKey"` | `providerKey`, `userSubscription` |  | How a session authenticates to the model. `providerKey` (the default): the runner's model gateway adds the provider key resolved for the session owner (user, then a workspace record's key, then tenant, then the application owner's key) and meters every call. `userSubscription`: the session runs on the session owner's own Claude (`claude-code`) or ChatGPT (`codex`) subscription, stored at the tenant or user level of the entry as a `subscriptionToken` credential; the application level is refused, a missing token is a 428 `AI_PROVIDER_CREDENTIAL_REQUIRED`, nothing is metered, frontend sessions only, `egress` must be `allowlist`, and the vendor's terms may restrict third-party use of a subscription login (validation warns, AGENT_HARNESS_SUBSCRIPTION_TERMS). |
| `model` | `String` | no |  |  |  | The model id the harness requests, for example `deepseek-chat` or `claude-sonnet-4-5`. Null uses the provider entry's defaultModel. |
| `maxTurns` | `Integer` | no |  |  | min 1 | Upper bound on model turns in one session. Null leaves the runtime's own limit in place; the guardrails timeout and cost ceilings apply either way. Not applied with `auth: userSubscription` (the gateway does not see those calls). |

## Constraints

Property rules:

- `providerName` must be present. (`REQUIRED_FIELD_MISSING`)
- `auth` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `maxTurns` must be at least 1. (`VALUE_OUT_OF_RANGE`)
