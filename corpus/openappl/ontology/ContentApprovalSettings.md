# ContentApprovalSettings

**Level:** `subsection` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentApprovalSettings in Part 2](../spec/ContentApprovalSettings.md)

Editorial approval workflow of a content model (publishingSettings.approvalSettings). When enabled, the always-present status machine grows two states — draft → inReview (submitForReview, edit-role gated) → approved (approve) / back to draft (rejectToDraft), both approve-role gated — and, with requireApprovalToPublish, publishing is only legal from 'approved' (scheduling counts: a scheduled record passed the approval check when it was scheduled). Approve/reject fire contentApproved/contentRejected lifecycle events; submitForReview fires contentSubmittedForReview. Enabling approval (with previewEnabled) also unlocks shareable per-record preview tokens on the delivery routes. All defaults are off — models without this section keep the exact P1 behavior.

## Contained in

- [ContentPublishingSettings](./ContentPublishingSettings.md) as `approvalSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
