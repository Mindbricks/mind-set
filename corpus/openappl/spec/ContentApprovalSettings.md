# ContentApprovalSettings

**Level:** `subsection` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentApprovalSettings in Part 1](../ontology/ContentApprovalSettings.md)

Editorial approval workflow of a content model (publishingSettings.approvalSettings). When enabled, the always-present status machine grows two states — draft → inReview (submitForReview, edit-role gated) → approved (approve) / back to draft (rejectToDraft), both approve-role gated — and, with requireApprovalToPublish, publishing is only legal from 'approved' (scheduling counts: a scheduled record passed the approval check when it was scheduled). Approve/reject fire contentApproved/contentRejected lifecycle events; submitForReview fires contentSubmittedForReview. Enabling approval (with previewEnabled) also unlocks shareable per-record preview tokens on the delivery routes. All defaults are off — models without this section keep the exact P1 behavior.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Master toggle for the approval workflow. When true the model's status machine grows the 'inReview' and 'approved' states and the submitForReview / approve / rejectToDraft transitions. Default: false. |
| `reviewRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Role names that participate in review: they gain editorial READ access to unpublished records (?preview=true and the editorial delivery surfaces) so they can inspect content sitting inReview without needing edit or publish rights. Required (non-empty) when enabled. |
| `approveRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Role names allowed to run the approve / rejectToDraft transitions. Required (non-empty) when enabled — an approval workflow nobody can approve would dead-end (absoluteRoles always bypass). |
| `requireApprovalToPublish` | `Boolean` | no | `false` |  |  | When true, the publish transition is REJECTED unless the record is 'approved' (or 'scheduled' — approval was checked when it was scheduled): content must walk draft → inReview → approved → published. When false (default) the review states are available but publishing stays legal from any state, as before. Requires enabled. |
| `editsResetApproval` | `Boolean` | no | `false` |  |  | When true, a CRUD update that changes the CONTENT of an 'approved' record — a declared field, the body, or the seo object; not editorial metadata — drops it back to 'inReview' through the content pipeline and fires contentSubmittedForReview, so approval always covers what is actually published. Published records are untouched (unpublish → edit → re-approve is the flow). When false (default) editing an approved record keeps its approval, as before. Requires enabled. |

## Constraints

Property rules:

- `reviewRoles`, `approveRoles` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
