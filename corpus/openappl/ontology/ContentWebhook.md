# ContentWebhook

**Level:** `subsection` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentWebhook in Part 2](../spec/ContentWebhook.md)

One outbound publishing webhook target of a content model (eventSettings.webhooks[]). The content-layer webhook dispatcher consumes the model's lifecycle Kafka topics and POSTs a JSON payload — { event, contentModel, contentId, slug?, locale?, publicPath?, occurredAt } — to the target URL for each subscribed event, with bounded retry and backoff; a dead endpoint never wedges the worker. When a secret is set, the request carries an HMAC-SHA256 signature of the raw body in the `x-mindbricks-signature` header ('sha256=<hex>') so the receiver can verify authenticity. A placeholder secret counts as no secret: that delivery goes out unsigned.

## Contained in

- [ContentEventSettings](./ContentEventSettings.md) as `webhooks` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
