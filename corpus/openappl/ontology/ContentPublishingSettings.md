# ContentPublishingSettings

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentPublishingSettings in Part 2](../spec/ContentPublishingSettings.md)

The publishing-workflow capability. Every content record ALWAYS carries the status machine — draft → published → archived, with 'scheduled' as the between-state of a future publishAt — plus 'publishedAt' stamped on first publish; this section tunes the behavior. Transitions run through the content-layer transition routes (or a ContentTransitionAction in a composed workflow) so the requiredToPublish checks, version capture, and lifecycle events always fire — raw status updates through the DataObject CRUD API are rejected by the synthesized guard.

## Contained in

- [ContentModel](./ContentModel.md) as `publishingSettings`

Blueprint paths:

- `services.contentModels.publishingSettings`

## Contains

- `approvalSettings`: [ContentApprovalSettings](./ContentApprovalSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
