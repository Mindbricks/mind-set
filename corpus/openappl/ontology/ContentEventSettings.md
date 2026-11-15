# ContentEventSettings

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentEventSettings in Part 2](../spec/ContentEventSettings.md)

Content lifecycle events are published to the project Kafka bus for transitions and version capture. Synthesized objects emit database-change events when writes occur, including generated editorial writes; Business API events follow each configured API. Lifecycle publication includes contentPublished, contentUnpublished, contentScheduled, contentArchived, contentRestored, versionCaptured and versionRestored. restore means un-archive; restoring a version uses restoreVersion, which neither publishes nor unpublishes (only a draft or archived record restores; published, scheduled, inReview and approved are refused 409, so workflow state changes only through transitions and their events). Webhooks consume the enabled lifecycle events.

## Contained in

- [ContentModel](./ContentModel.md) as `eventSettings`

Blueprint paths:

- `services.contentModels.eventSettings`

## Contains

- `webhooks`: [ContentWebhook](./ContentWebhook.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
