# AgentHarnessPlugin

**Level:** `section` · **Family:** [AgentHarness](../ontology/families.md#agentharness) (domain `AgentHubConfig`)

**Ontology:** [AgentHarnessPlugin in Part 1](../ontology/AgentHarnessPlugin.md)

**Name:** an instance is named by `name`.

A runtime-native plugin of an AgentHarness, installed into the harness profile at runner build. The AI designer may add plugins; the validator accepts only an exact version (AGENT_HARNESS_PLUGIN_UNPINNED) from a source the runtime allows (AGENT_HARNESS_PLUGIN_SOURCE_NOT_ALLOWED).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The plugin package name, npm style and optionally scoped (`@scope/name`). |
| `version` | `String` | yes |  |  |  | One exact semver version, for example `1.4.2`. Ranges (`^1.4.0`, `~1.4`), wildcards and tags such as `latest` are refused. |
| `source` | `AgentHarnessPluginSource` | no | `"registry"` | `registry`, `npm` |  | Where the plugin is installed from: `registry` (the runtime's own registry or marketplace) or `npm`. dsh allows both, claude-code allows registry, goose, codex and opencode allow none. |

## Constraints

Property rules:

- `name`, `version` must be present. (`REQUIRED_FIELD_MISSING`)
- `source` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
