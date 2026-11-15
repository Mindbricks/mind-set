# VideoRoomAuthScript

**Level:** `subsection` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoomAuthScript in Part 1](../ontology/VideoRoomAuthScript.md)

**Name:** an instance is named by `name`.

An MScript-based authorization source for video room access, evaluated with 'user' (session data) and 'room' (room record) as context variables. If the script returns true, the user is granted the specified roomRole. Scripts are evaluated after authSources, top-to-bottom; the first match wins. Mirrors HubAuthScript.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique identifier for this authorization script. Examples: 'vipAccess', 'publicRoomGuest'. |
| `script` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression that must evaluate to a boolean. Context variables: 'user' (authenticated session) and 'room' (the room DataObject record). Can call library functions. Example: `{ "js": "user.tier == 'gold' && room.isPublic" }`. |
| `roomRole` | `String` | no |  |  |  | The roomRole assigned to the user if this script returns true. Must correspond to a role defined in the roomRoles section. If null, the user is authorized with the room kind's default capabilities. |

## Constraints

Property rules:

- `name`, `script` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
