# ContentWebhook

**Level:** `subsection` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentWebhook in Part 1](../ontology/ContentWebhook.md)

**Name:** an instance is named by `name`.

One outbound publishing webhook target of a content model (eventSettings.webhooks[]). The content-layer webhook dispatcher consumes the model's lifecycle Kafka topics and POSTs a JSON payload — { event, contentModel, contentId, slug?, locale?, publicPath?, occurredAt } — to the target URL for each subscribed event, with bounded retry and backoff; a dead endpoint never wedges the worker. When a secret is set, the request carries an HMAC-SHA256 signature of the raw body in the `x-mindbricks-signature` header ('sha256=<hex>') so the receiver can verify authenticity. A placeholder secret counts as no secret: that delivery goes out unsigned.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique name of this webhook target within the model (e.g. 'siteBuildHook', 'cdnPurge'). Names the consumer group segment and the CONTENT_WEBHOOK_<NAME>_SECRET env override. Must be a valid codeName. |
| `url` | `String` | yes |  |  |  | The absolute http(s) URL the signed event POST is sent to — a static-site build hook, a cache-purge endpoint, or any HTTP consumer. |
| `events` | `ContentWebhookEvent`[] | no | `["published","unpublished"]` | 10 values, see [ContentWebhookEvent](#contentwebhookevent) |  | The lifecycle events this target subscribes to. Empty/absent = the default pair [published, unpublished] — the go-live/go-offline signals a static rebuild needs. |
| `secret` | `String` | no |  |  |  | Optional shared secret for signing. When set, every POST carries `x-mindbricks-signature`: 'sha256=<HMAC-SHA256 hex of the raw body>'. Sensitive — masked in API responses; the generated service also honors a CONTENT_WEBHOOK_<NAME>_SECRET env var, which overrides this value. A placeholder (`ENTER_CREDENTIAL`, a `****` mask, a `$SECRET_` echo) is not a secret: it never signs, a placeholder env var never shadows a real value here, and with no real secret the delivery is sent unsigned (logged once per target as ContentWebhookSecretPlaceholder; validation warns CONTENT_WEBHOOK_SECRET_PLACEHOLDER). |

## Allowed values

### ContentWebhookEvent

`published`, `unpublished`, `scheduled`, `archived`, `restored`, `versionCaptured`, `versionRestored`, `submittedForReview`, `approved`, `rejected`

## Constraints

Property rules:

- `name`, `url` must be present. (`REQUIRED_FIELD_MISSING`)
- `events` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
