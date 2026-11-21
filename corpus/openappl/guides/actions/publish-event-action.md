---
title: PublishEventAction
---

# PublishEventAction

`PublishEventAction` emits a **custom** domain event to Kafka from inside a Business API workflow. Use it for application-specific events that aren't already covered by the default API event a compiler emits when `raiseApiEvent: true` is set under `ApiOptions`.

> **Note:** when the parent Business API has `raiseApiEvent: true`, a standard API-level event (named after the API and shaped as the response) is published automatically. Don't reproduce that event with `PublishEventAction`, use this action only for *additional* events beyond the default.

## When to use it

- Emit a domain event with a different topic, shape, or trigger than the default API event (e.g., a `payment.high_risk_detected` flagged from inside a checkout API).
- Notify a separate consumer service about a side effect computed during the workflow.
- Drive a cross-service saga step where the next step needs a custom payload.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `topic` | `String` | ✓ | Name of the Kafka topic, channel, or event key the message is published to. Conventionally `<domain>.<event>` (e.g., `order.shipped`, `user.invited`). |
| `message` | `MScript` | ✓ | Expression evaluating to the payload to publish. Can be a primitive, object, or string; objects are serialized. May reference `this`, the session, and earlier action results. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

The action evaluates `message` and publishes the payload to the topic, with the session and the request id attached. The publish completes before the action returns; the workflow then moves on to the next action.

The publisher applies two transforms, in this order, so `topic` on this action is the logical name and never the on-the-wire one. First the PROJECT SCOPE: an authored topic goes on the wire as `<projectCodename>-<topic>`, the same namespace every derived topic family uses, so two projects on one broker that both author `order.shipped` do not share it. It is idempotent, so a topic you deliberately author inside the project namespace is left as written. Then the deployer's alias mapping: a topic alias resolver the project registers is applied (e.g. an environment prefix like `prod-` or a tenant scope). A consumer inside the project subscribes by the declared name and is scoped by the same helper, so both ends move together; a hand-written consumer passes the declared name to the listener helper rather than composing the prefix. See [Kafka topic naming](../best-practices/kafka-topic-naming.md) for the wire name, the alias contract and the migration note for an external consumer.

Outgoing events on aliases declared in `serviceOptions.secureEvents` are wrapped in a project-signed envelope `{ _secure, alias, payload, sig, kid, jwks_url }` using the project's Ed25519 key before publish. Consumers verify the envelope before using the payload. Plain (non-secure) aliases publish the payload without that wrapper.

Secrets never ride along, whatever the `message` MScript dereferences. The publisher deep-scrubs the whole envelope at a single choke point, removing two sets of keys at any depth: the fixed credential vocabulary (`accessToken`, `password`, `refreshToken`, ...) and every property the project declared [`hashed: true` or `isSecret: true`](../../spec/PropertyBasicSettings.md), registered at bootstrap from the same list the api layer uses to scrub responses. So `{ js: "{ ref: this.merchant.payoutDestinationRef }" }` publishes an event without `payoutDestinationRef` when that column is declared secret, the declaration governs every outbound surface, not just the HTTP response. Non-secret siblings are untouched; if you need the value on the topic, do not declare the column secret.

Topic naming convention and consumer wiring are covered in [Kafka topic naming](../best-practices/kafka-topic-naming.md) and [Kafka controllers](../business-apis/kafka-controllers.md). The receiving service declares an event subscription pointing at the same topic; see [event subscriptions](../capabilities/event-subscriptions.md).

## Example

```json
{
  "name": "publishHighValueOrder",
  "condition": { "js": "this.order.totalAmount > 1000" },
  "topic": "order.high_value_detected",
  "message": { "js": "{ orderId: this.order.id, customerId: this.order.customerId, total: this.order.totalAmount, currency: this.order.currency }" }
}
```

## Errors

- Kafka unavailable, the action throws; honour `onActionError` to decide whether to abort the API.
- Payload non-serializable, provider throws on publish.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [Event subscriptions](../capabilities/event-subscriptions.md).
- [Kafka controllers](../business-apis/kafka-controllers.md).
- [Kafka topic naming](../best-practices/kafka-topic-naming.md).
- `ApiOptions.raiseApiEvent`, the default API event you usually want instead of a custom one.
