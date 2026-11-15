# ContentEventSettings

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentEventSettings in Part 1](../ontology/ContentEventSettings.md)

Content lifecycle events are published to the project Kafka bus for transitions and version capture. Synthesized objects emit database-change events when writes occur, including generated editorial writes; Business API events follow each configured API. Lifecycle publication includes contentPublished, contentUnpublished, contentScheduled, contentArchived, contentRestored, versionCaptured and versionRestored. restore means un-archive; restoring a version uses restoreVersion, which neither publishes nor unpublishes (only a draft or archived record restores; published, scheduled, inReview and approved are refused 409, so workflow state changes only through transitions and their events). Webhooks consume the enabled lifecycle events.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `publishLifecycleEvents` | `Boolean` | no | `true` |  |  | When true (default), the model publishes its editorial lifecycle events to Kafka. Frontend cache purge / static rebuild hooks are driven by these events, so disabling them also disables those integrations (webhooks[] included). |
| `webhooks` | [`ContentWebhook`](./ContentWebhook.md)[] | no |  |  |  | Outbound publishing webhooks of this content model. Each target receives a signed HTTP POST when a subscribed lifecycle event fires — a static-site build hook (Next/Astro/Netlify/Vercel deploy hooks are plain POST targets), a cache purge endpoint, or any downstream consumer. The webhook IS the rebuild trigger: no builder-specific adapters exist or are needed. Empty/absent = no webhooks (the default; existing models are untouched). |

## Constraints

Property rules:

- The items of `webhooks` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
