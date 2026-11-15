# PublishEventAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [PublishEventAction in Part 2](../spec/PublishEventAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Publishes a message to an event topic (such as a message bus, queue, or pub/sub channel) as part of the Business API flow. This action is used to emit domain events or trigger asynchronous workflows that are consumed by other services or systems. The payload is defined using MScript and can include structured data from the API context. On the wire the message rides inside the unified event envelope — consumers that receive the RAW wire message (an AIAgent `kafkaController.dataMapping`) read it from the envelope's `data` key (`{ id, type, source, time, requestId, actor, data }`), while consumers the framework unwraps for them (an EventNotification `targetPathInData`, whose listener reads `record = event.data`) address the authored message's own keys directly and must NOT add a `data.` prefix. The declared topic doubles as the default envelope `type`, and on the WIRE it is project-scoped as `<projectCodename>-<topic>` - every framework-derived topic family already carried that prefix, and authored topics now do too, so two projects on one broker cannot share a topic by both authoring the same name. Subscribe by the declared name: the framework scopes producer and consumer with the same helper.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `publishEventActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.publishEventActions`
- `services.businessLogic.actions.publishEventActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
