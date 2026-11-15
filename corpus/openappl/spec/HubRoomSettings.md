# HubRoomSettings

**Level:** `section` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubRoomSettings in Part 1](../ontology/HubRoomSettings.md)

Configures how rooms are managed and who can join them. Every hub requires a roomDataObject -- an existing DataObject that represents rooms. Authorization uses a layered flow: (1) roomEligibility checks if the room supports real-time features, (2) absoluteRoles bypass all checks, (3) checkRoles gates access to specific user roles, (4) checkScript applies a custom condition, (5) authSources and authScripts (OR-logic) determine the user's hub role. The first matching authSource/authScript wins (ordered highest-privilege first).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `roomDataObject` | [`LocalDataObjectName`](./LocalDataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | Name of the existing DataObject that represents rooms in this hub. The DataObject must be defined in the same service. Examples: 'Chat', 'ChessMatch', 'SupportTicket'. Clients join rooms by referencing the ID of this DataObject. |
| `roomEligibility` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript condition evaluated against the room record (fetched from Elasticsearch) BEFORE any authorization. The context variable name is the roomDataObject name (e.g., if roomDataObject is 'catalogEvent', use 'catalogEvent.chatEnabled'). The generic alias 'room' is also available. If false, the room does not support real-time features and NOBODY can join -- including absoluteRoles. Examples: `{ "js": "catalogEvent.chatEnabled == true" }`, `{ "js": "catalogEvent.status == 'published'" }`. |
| `absoluteRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | List of role names (from session.roleId) that bypass ALL authorization checks. Users with any of these roles get the built-in 'system' hub role with full permissions. Checked AFTER roomEligibility (even superAdmins cannot join ineligible rooms). Examples: ['superAdmin'], ['superAdmin', 'systemAdmin']. |
| `checkRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | List of role names that are REQUIRED to proceed to auth sources. If defined, users whose roleId is NOT in this list are immediately denied. Use to restrict hub access to specific user tiers. Examples: ['premiumUser', 'subscriber']. Leave empty to allow all roles. |
| `checkScript` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript condition evaluated after checkRoles and before authSources. Context variables: 'user' (session data) and the roomDataObject name for the room record (e.g., 'catalogEvent'). The generic alias 'room' is also available. Must return true to proceed. Examples: `{ "js": "user.city == catalogEvent.city" }`, `{ "js": "user.subscriptionLevel >= catalogEvent.minLevel" }`. |
| `authSources` | [`HubAuthSource`](./HubAuthSource.md)[] | no |  |  |  | Ordered array of DataObject-based authorization sources. Each source queries Elasticsearch for a record matching the user and room. Sources are checked top-to-bottom (highest-privilege first). The FIRST matching source determines the user's hub role -- remaining sources are skipped. Each source can have an optional 'condition' MScript evaluated against the found record (context variable: 'record'). |
| `authScripts` | [`HubAuthScript`](./HubAuthScript.md)[] | no |  |  |  | Ordered array of MScript-based authorization sources. Checked after authSources if no authSource matched. Each script is evaluated with 'user' (session) and 'room' (room record) context. The FIRST script returning true determines the user's hub role. Use for complex authorization logic that can call library functions. |

## Constraints

Property rules:

- `roomDataObject` must be present. (`REQUIRED_FIELD_MISSING`)
- `absoluteRoles`, `checkRoles` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `roomDataObject` must be a well-formed [`LocalDataObjectName`](./LocalDataObjectName.md) (a data object of the same service). (`INVALID_LOCAL_DATA_OBJECT_NAME_FORMAT`)
- The items of `authSources` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `authScripts` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
