# VideoRoomSettings

**Level:** `section` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoomSettings in Part 1](../ontology/VideoRoomSettings.md)

Binds the video room to an existing DataObject and configures who may join and with which roomRole. Every video room requires a roomDataObject — an existing DataObject that represents the room (a meeting, a lesson, a live event); clients request tokens by referencing the ID of this DataObject. Authorization uses the RealtimeHub layered flow: (1) roomEligibility checks the room record supports video, (2) absoluteRoles bypass all checks (full-capability system role), (3) checkRoles gates access to specific user roles, (4) checkScript applies a custom condition, (5) authSources and authScripts (OR-logic, ordered highest-privilege first) determine the user's roomRole — the first match wins.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `roomDataObject` | [`LocalDataObjectName`](./LocalDataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | Name of the existing DataObject that represents rooms of this video room. Must be defined in the same service. Examples: 'Meeting', 'Lesson', 'LiveEvent'. Clients request join tokens by referencing the ID of this DataObject. |
| `roomEligibility` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript condition evaluated against the room record BEFORE any authorization. The context variable name is the roomDataObject name (generic alias 'room' also available). If false, the room does not support video and NOBODY can join — including absoluteRoles. Examples: `{ "js": "meeting.videoEnabled == true" }`, `{ "js": "liveEvent.status == 'live'" }`. |
| `absoluteRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | List of role names (from session.roleId) that bypass ALL authorization checks. Users with any of these roles get the built-in 'system' room role with full media capabilities. Checked AFTER roomEligibility. Examples: ['superAdmin']. |
| `checkRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | List of role names REQUIRED to proceed to auth sources. If defined, users whose roleId is NOT in this list are immediately denied. Leave empty to allow all roles. |
| `checkScript` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript condition evaluated after checkRoles and before authSources. Context variables: 'user' (session data) and the roomDataObject name for the room record (generic alias 'room'). Must return true to proceed. Example: `{ "js": "user.tenantId == meeting.tenantId" }`. |
| `authSources` | [`VideoRoomAuthSource`](./VideoRoomAuthSource.md)[] | no |  |  |  | Ordered array of DataObject-based authorization sources. Each source queries for a record matching the user and room; sources are checked top-to-bottom (highest-privilege first) and the FIRST match determines the user's roomRole. Example: a 'host' source on an eventHost join-table, then an 'attendee' source on issuedTicket. |
| `authScripts` | [`VideoRoomAuthScript`](./VideoRoomAuthScript.md)[] | no |  |  |  | Ordered array of MScript-based authorization sources, checked after authSources if none matched. Each script is evaluated with 'user' and 'room' context; the FIRST script returning true determines the user's roomRole. |

## Constraints

Property rules:

- `roomDataObject` must be present. (`REQUIRED_FIELD_MISSING`)
- `absoluteRoles`, `checkRoles` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `roomDataObject` must be a well-formed [`LocalDataObjectName`](./LocalDataObjectName.md) (a data object of the same service). (`INVALID_LOCAL_DATA_OBJECT_NAME_FORMAT`)
- The items of `authSources` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `authScripts` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
