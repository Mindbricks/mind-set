# EventSubTopic

**Level:** `section` · **Family:** [EventSubscription](./families.md#eventsubscription) (domain `Service`)

**Specification:** [EventSubTopic in Part 2](../spec/EventSubTopic.md)

A Kafka topic included in this subscription. First select the DataObject -- the available topics are derived from the DataObject's API events and DB events. Authorization defaults to the DataObject's access level (public/protected/private) but can be overridden with forceAccessLevel. The payload can be transformed or fields can be excluded before delivery to the client.

## Contained in

- [EventSubscription](./EventSubscription.md) as `topics` (a list)

Blueprint paths:

- `services.eventSubscriptions.topics`

## Contains

No other pattern: every property is a value or a reference.

## References

- `dataObjectName` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
