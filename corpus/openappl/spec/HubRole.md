# HubRole

**Level:** `section` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubRole in Part 1](../ontology/HubRole.md)

**Name:** an instance is named by `name`.

Defines a named permission set for hub users. Each role controls what actions a user can perform within a room. Roles are assigned by authSources, authScripts, or absoluteRoles. A built-in 'system' role (all permissions true) is automatically used for absoluteRoles users. When globalModeration or the role's 'moderated' flag is true, messages require moderator approval before broadcast.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique role name. Referenced by authSources and authScripts via their hubRole property. Convention: lowercase descriptive names. Examples: 'owner', 'moderator', 'attendee', 'viewer'. |
| `canRead` | `Boolean` | no | `true` |  |  | When true, the user receives the room: hub:history on join, hub:state, room broadcasts, and REST GET messages. When false the role is write-only: the user joins the room and may send (canSend), and moderation commands still reach it, but it gets no history, no state, no broadcasts, and REST GET messages answers 403 HUB_READ_FORBIDDEN. A role with canModerate true always reads (it must see pending messages), so canRead false has no effect on it and validation warns (HUB_ROLE_MODERATOR_READS). Default: true. |
| `canSend` | `Boolean` | no | `true` |  |  | When true, the user can send messages. When false, the user is read-only (viewer). Default: true. |
| `allowedMessageTypes` | `String` | no |  |  |  | Comma-separated list of message types this role can send. If empty, all hub message types are allowed. Use to restrict certain roles to text-only or exclude media types. Examples: 'text', 'text,image'. |
| `moderated` | `Boolean` | no | `false` |  |  | When true, messages from users with this role are saved as 'pending' and require moderator approval before being broadcast to the room. Default: false. |
| `canModerate` | `Boolean` | no | `false` |  |  | When true, the user can approve/reject pending messages, and block/silence other users. Default: false. |
| `canDeleteAny` | `Boolean` | no | `false` |  |  | When true, the user can delete any message in the room (not just their own). Default: false. |
| `canManageRoom` | `Boolean` | no | `false` |  |  | When true, the user can update room settings and kick users from the room. Default: false. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
