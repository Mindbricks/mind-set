# VideoRoomAuthSource

**Level:** `subsection` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoomAuthSource in Part 1](../ontology/VideoRoomAuthSource.md)

**Name:** an instance is named by `name`.

A DataObject-based authorization source for video room access. Queries for a record in the specified DataObject where userField matches the authenticated user and roomField matches the target room. If a record is found (and the optional condition passes), the user is granted the specified roomRole. Sources are evaluated top-to-bottom; the first match wins. Mirrors HubAuthSource.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique identifier for this authorization source. Examples: 'eventHost', 'ticketHolder', 'roomOwner'. |
| `sourceObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | Name of the DataObject to query. Can be the room DataObject itself (ownership check), a membership/join-table DataObject, or any other DataObject. Examples: 'issuedTicket', 'eventHost', 'meeting'. |
| `userField` | [`PropRefer`](./PropRefer.md) | yes | `null` |  | names a [DataProperty](./DataProperty.md) from `sourceObject` | Property on the DataObject that holds the user identifier, matched against the authenticated user's userId. Examples: 'userId', 'ownerUserId', 'hostId'. |
| `roomField` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `sourceObject` | Property on the DataObject that holds the room identifier, matched against the room's ID. Use 'id' when checking the room DataObject itself (ownership pattern). Examples: 'meetingId', 'eventId', 'id'. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript condition evaluated against the found record. The context variable name matches the 'sourceObject' name (generic alias 'record'). If false, this source does not match and the next source is tried. Example: `{ "js": "issuedTicket.status == 'active'" }`. |
| `roomRole` | `String` | no |  |  |  | The roomRole assigned to the user if this source matches. Must correspond to a role defined in the roomRoles section. If null, the user is authorized with the room kind's default capabilities. |

## Constraints

Property rules:

- `name`, `sourceObject`, `userField`, `roomField` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `sourceObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `userField`, `roomField` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
