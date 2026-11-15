# PublishEventAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [PublishEventAction in Part 1](../ontology/PublishEventAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Publishes a message to an event topic (such as a message bus, queue, or pub/sub channel) as part of the Business API flow. This action is used to emit domain events or trigger asynchronous workflows that are consumed by other services or systems. The payload is defined using MScript and can include structured data from the API context. On the wire the message rides inside the unified event envelope — consumers that receive the RAW wire message (an AIAgent `kafkaController.dataMapping`) read it from the envelope's `data` key (`{ id, type, source, time, requestId, actor, data }`), while consumers the framework unwraps for them (an EventNotification `targetPathInData`, whose listener reads `record = event.data`) address the authored message's own keys directly and must NOT add a `data.` prefix. The declared topic doubles as the default envelope `type`, and on the WIRE it is project-scoped as `<projectCodename>-<topic>` - every framework-derived topic family already carried that prefix, and authored topics now do too, so two projects on one broker cannot share a topic by both authoring the same name. Subscribe by the declared name: the framework scopes producer and consumer with the same helper.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `topic` | `String` | yes |  |  |  | The name of the topic, channel, or event key to which the message will be published. This string typically matches the naming convention of the consuming system (e.g., `project.created`, `user.signup`). |
| `message` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the message payload to send. This can be a primitive value, object, or string and may reference `this`, session data, or previous action results. |
| `actorTenantId` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript tenant id for session-less cron or system APIs publishing tenant-scoped events, for example { js: 'this.row.companyId' }. Evaluated only when the publishing session carries no tenant. A non-null result replaces eventTenantFallback() as the envelope actor tenant fallback; null uses the existing fallback. A session tenant always wins and suppresses evaluation of this expression. Consumers derive tenant scope from the envelope actor, so set this per processed tenant row on SaaS-level APIs. It does not override a tenant user's session, change the message payload, or grant tenant access. Nodejs supports this slot; other language publishers require the corresponding port. |
| `allowEmptyKeys` | `String` | no |  |  |  | Comma-separated TOP-LEVEL keys of `message` that are allowed to be empty or absent ON PURPOSE. A deliberately-empty optional fan-out field had no way to say so, and the two checks that judge a publish payload then contradicted each other: `{ recipients: [] }` raised PAYLOAD_EMPTY_ARRAY ("the target always receives no data"), while sourcing the same key from an `isRequired: false` fetch raised PUBLISH_OPTIONAL_CONTEXT_UNGUARDED ("the payload silently carries null fields") — so the only escape was a ceremonial AddToContextAction setting the key to `[]` a second time. Naming a key here states the intent directly and silences BOTH findings for that key alone; every other key is judged exactly as before. Design-time only: no generator reads it, and the published payload is byte-identical with or without it. |

## Constraints

Property rules:

- `topic`, `message` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `EXPLICIT_TOPIC_REQUIRED` | error | PublishEventAction "…" must declare an explicit Kafka topic name (non-empty string). |
| `PUBLISH_ACTOR_TENANT_SESSION_PRECEDENCE` | warning | PublishEventAction actorTenantId is meaningful only on session-less or SaaS-level APIs. |
| `PUBLISH_OPTIONAL_CONTEXT_UNGUARDED` | warning | PublishEventAction "…" publishes a message referencing …, but … bound by a fetch action with isRequired:false — when the fetch finds no row the context is empty and the event payload silently carries null fields. |

## Example

Use to emit a domain event onto a topic so other services or async consumers can react — decoupling side effects from the request lifecycle.

```json
{
  "name": "publishOrderPlaced",
  "description": "Announce a placed order for fulfillment and analytics consumers.",
  "topic": "order.placed",
  "message": { "js": "{ orderId: this.order.id, customerId: this.order.customerId, total: this.order.totalAmount, placedAt: new Date().toISOString() }" }
}
```
