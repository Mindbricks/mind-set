# HubAuthScript

**Level:** `subsection` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubAuthScript in Part 1](../ontology/HubAuthScript.md)

**Name:** an instance is named by `name`.

An MScript-based authorization source for hub room access. The script is evaluated with 'user' (session data) and 'room' (room record from Elasticsearch) as context variables. Scripts can call library functions for complex logic. If the script returns true, the user is granted the specified hubRole. Scripts are evaluated after authSources, top-to-bottom; the first match wins.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique identifier for this authorization script. Used as a reference name in logs and documentation. Examples: 'vipAccess', 'geoRestriction', 'publicRoomGuest'. |
| `script` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression that must evaluate to a boolean. Context variables: 'user' (authenticated session with userId, roleId, etc.) and 'room' (the room DataObject record). Can call library functions. Examples: `{ "js": "lib.checkVIPAccess(user, room)" }`, `{ "js": "user.tier == 'gold' && room.isPublic" }`. |
| `hubRole` | `String` | no |  |  |  | The hub role assigned to the user if this script returns true. Must correspond to a role defined in the hubRoles section. If null, the user is authorized but gets no specific role (all members have equal permissions). |

## Constraints

Property rules:

- `name`, `script` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
