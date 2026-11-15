# EventSubTopic

**Level:** `section` · **Family:** [EventSubscription](../ontology/families.md#eventsubscription) (domain `Service`)

**Ontology:** [EventSubTopic in Part 1](../ontology/EventSubTopic.md)

**Name:** an instance is named by `name`.

A Kafka topic included in this subscription. First select the DataObject -- the available topics are derived from the DataObject's API events and DB events. Authorization defaults to the DataObject's access level (public/protected/private) but can be overridden with forceAccessLevel. The payload can be transformed or fields can be excluded before delivery to the client.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Client-facing event name emitted when a matching Kafka message arrives. Example: 'orderCreated', 'reviewAdded', 'inventoryChanged'. |
| `dataObjectName` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The DataObject this topic belongs to. Select the DataObject first, then choose the topic. The DataObject's authorization config (public/protected/private, tenant scoping) drives the default access control for this topic. |
| `topic` | `String` | yes |  |  |  | Kafka topic to subscribe to, written as the full topic name. There is no alias syntax: a string such as 'order.created', 'review_updated' or 'dbEvent:inventory:updated' is subscribed under exactly that name, which nothing publishes (validation warns KAFKA_TOPIC_UNKNOWN_PRODUCER). The only rewrite is the project scope: a topic a PublishEventAction of this project authors, or a framework topic of this project written without its `<projectCodename>-` prefix, is consumed under the prefixed wire name. The available topics are derived from the selected DataObject's API events and DB events (DB events: `<projectCodename>-<serviceName>-service-dbevent-<objectname>-<created\|updated\|deleted>`); `getKafkaEventTopicsOfService` lists them. |
| `description` | `String` | no |  |  |  | Human-readable description of this topic event. |
| `forceAccessLevel` | `DataObjectAccess` | no | `null` | `accessPrivate`, `accessProtected`, `accessPublic` |  | Override the DataObject's default access level for this specific topic. Leave null (the default) to inherit the owning DataObject's own `dataObjectAccess`; a topic whose DataObject cannot be resolved in this service falls back to 'accessPrivate' and raises an EVENT_SUB_TOPIC_OBJECT_UNRESOLVED warning. Set to 'accessPublic' to make events visible to everyone, 'accessProtected' for all authenticated users, or 'accessPrivate' to require ownership. |
| `payloadMapping` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression that builds the client-facing payload from the event. Context: 'data' (the event record, the envelope's data) and 'event' (the whole event envelope: id, type, source, time, requestId, actor, data, old). Its value is what the subscriber receives, then excludeFields is applied. A mapping that throws drops that event for that subscriber (logged, rate-limited); the full record is never sent in its place. Compiled into the generated service at build time. Example: `{ "js": "{ orderId: data.id, status: data.status, updatedAt: data.updatedAt }" }`. If omitted, the record is sent (minus excludeFields). |
| `excludeFields` | `String`[] | no |  |  |  | List of field names to strip from the payload before sending to clients. Applied after payloadMapping (if defined) or on the raw payload. Use to hide sensitive/internal fields. Example: ['internalNotes', 'costBreakdown', 'adminFlags']. |

## Constraints

Property rules:

- `name`, `dataObjectName`, `topic` must be present. (`REQUIRED_FIELD_MISSING`)
- `forceAccessLevel` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `dataObjectName` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
