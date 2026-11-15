# HubAuthSource

**Level:** `subsection` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubAuthSource in Part 1](../ontology/HubAuthSource.md)

**Name:** an instance is named by `name`.

A DataObject-based authorization source for hub room access. Queries Elasticsearch for a record in the specified DataObject where userField matches the authenticated user and roomField matches the target room. If a record is found (and the optional condition passes), the user is granted the specified hubRole. Sources are evaluated top-to-bottom; the first match wins.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique identifier for this authorization source. Used as a reference name in logs and documentation. Examples: 'ticketHolder', 'eventOwner', 'hostAssignment'. |
| `sourceObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | Name of the DataObject to query in Elasticsearch. Can be the room DataObject itself (for ownership checks), a membership/join-table DataObject, or any other DataObject. The query searches for a record where userField = current userId AND roomField = roomId. Examples: 'issuedTicket', 'eventHost', 'catalogEvent'. |
| `userField` | [`PropRefer`](./PropRefer.md) | yes | `null` |  | names a [DataProperty](./DataProperty.md) from `sourceObject` | Property on the DataObject that holds the user identifier. Matched against the authenticated user's userId. Examples: 'userId', 'ownerUserId', 'createdBy', 'playerId'. |
| `roomField` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `sourceObject` | Property on the DataObject that holds the room identifier. Matched against the room's ID. Use 'id' when checking the room DataObject itself (ownership pattern). Examples: 'eventId', 'chatId', 'id'. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript condition evaluated against the found record. The context variable name matches the 'sourceObject' name (e.g., if sourceObject is 'issuedTicket', use 'issuedTicket.status'). The generic alias 'record' is also available. If the condition returns false, this source does not match and the next source is tried. Examples: `{ "js": "issuedTicket.status == 'active'" }`, `{ "js": "eventHost.role == 'lead'" }`. |
| `hubRole` | `String` | no |  |  |  | The hub role assigned to the user if this source matches. Must correspond to a role defined in the hubRoles section. If null, the user is authorized but gets no specific role (all members have equal permissions). Examples: 'owner', 'moderator', 'attendee'. |

## Constraints

Property rules:

- `name`, `sourceObject`, `userField`, `roomField` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `sourceObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `userField`, `roomField` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
