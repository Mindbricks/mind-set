# HubBasics

**Level:** `section` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubBasics in Part 1](../ontology/HubBasics.md)

Core identity of the realtime hub. The name is used in the Socket.IO namespace path (`/<service>-api/hub/{name}`), kebab-cased as the REST endpoint prefix (`/{kebab-name}` under the service's `/<service>-api` route), and as the code identifier.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique hub identifier within the service. Used in the Socket.IO namespace (`/<service>-api/hub/{name}`) and, kebab-cased, as the REST endpoint prefix ('chatHub' serves `/chat-hub/...`). Must be a valid code name (camelCase, no spaces). Examples: 'chatHub', 'gameLobby', 'liveDashboard'. |
| `description` | `Text` | no |  |  |  | Human-readable description of the hub's purpose. Used in documentation and AI assistant context. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
