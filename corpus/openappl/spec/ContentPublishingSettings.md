# ContentPublishingSettings

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentPublishingSettings in Part 1](../ontology/ContentPublishingSettings.md)

The publishing-workflow capability. Every content record ALWAYS carries the status machine — draft → published → archived, with 'scheduled' as the between-state of a future publishAt — plus 'publishedAt' stamped on first publish; this section tunes the behavior. Transitions run through the content-layer transition routes (or a ContentTransitionAction in a composed workflow) so the requiredToPublish checks, version capture, and lifecycle events always fire — raw status updates through the DataObject CRUD API are rejected by the synthesized guard.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `schedulingEnabled` | `Boolean` | no | `false` |  |  | When true, records may carry 'publishAt' / 'unpublishAt' timestamps and the content scheduler flips them live/offline at those times (status 'scheduled' between a publish transition with a future publishAt and the moment it goes live). Default: false. |
| `previewEnabled` | `Boolean` | no | `false` |  |  | Only an explicit true lets editorial roles preview unpublished records by id with ?preview=true on delivery routes. Preview is off unless set true, including when previewEnabled is omitted or publishingSettings is absent. Approval-enabled routed/singleton models also support shareable preview tokens when previewEnabled is explicitly true. The editor still seeds an explicit true when creating a publishingSettings section. |
| `approvalSettings` | [`ContentApprovalSettings`](./ContentApprovalSettings.md) | no |  |  |  | The editorial approval-workflow capability. Absent/disabled (default) = the plain draft → published machine. Enabled = the status machine grows 'inReview' and 'approved' states with submitForReview / approve / rejectToDraft transitions, and shareable per-record preview tokens become mintable (previewEnabled permitting). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
