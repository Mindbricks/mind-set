# ObjectModeration

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ObjectModeration in Part 2](../spec/ObjectModeration.md)

Decision-moderated writes on a data object. When `enabled`, the create and update Business APIs of this object ask the decision provider named by `providerName` ONE framework-owned `choice` question, `verdict`, over { accept, reject, review }, with `policy` as its instructions and the written values (restricted to `moderatedProperties`) as its state. `review` is the escape option - a human should decide - and it is always offered, because a forced choice with no way out answers wrong with high confidence; a verdict whose confidence is below `confidenceThreshold` is routed to `review` too. The decision is synchronous, inside the request: an isolated provider call measured 250-400 ms. On `accept` the write continues in the same request with every hook, event and response of a direct write. In `staged` mode a `reject` or `review` answers 202 with { moderation: { id, status, message } } and NOTHING is written to the object; in `onPlace` mode the write lands whatever the verdict and the answer carries `moderation` beside the record. Over gRPC the response message of a moderated create / update declares the same outcome as a `moderation` field (tag 1000): a hold answers OK with only that field set and the `x-moderation-status` / `x-moderation-id` metadata. Every submission is a row of the framework-generated `sys_<X>ModerationReview` object, which STORES the decision (value, confidence, probabilities, pinned model, decidedBy: provider | mock | human); it is never re-derived later, because the decision is reproducible across identical requests and the probability is not. One submission is pending per target row: a newer update supersedes the older one visibly, it is not deleted. `reviewerRoles` accept or reject held rows through injected Business APIs, never their own; an accept replays the author's original write through the api's own path, so its events and post-write workflow fire as on a direct write. WHO IS MODERATED: every caller except trusted system transports (cron, internal calls) and `exemptRoles`. This is CONTENT moderation, not authorization - `absoluteRoles` do NOT bypass it, and the verdict never feeds a permission check. An update that touches none of the `moderatedProperties` writes straight through, so a counter bumped by a sale never queues. Refused on auth-service objects and framework `sys_` objects. Both modes, the onPlace read gate and what it does not cover, the reviewer apis, the review row and every validation code are in the docs-site guide [Object content moderation](../guides/capabilities/object-moderation.md). Data-object moderation is implemented for nodejs and java, and for dotnet in mode staged (onPlace is refused on dotnet, and a dotnet gRPC answer does not carry the `moderation` field yet). ContentModel staged editorial moderation has a separate qualified nodejs/java/dotnet/rust support gate; onPlace remains refused.

## Contained in

- [ContentModel](./ContentModel.md) as `contentModeration`
- [ObjectSettings](./ObjectSettings.md) as `objectModeration`

Blueprint paths:

- `authentication.dataObjects.objectSettings.objectModeration`
- `services.dataObjects.objectSettings.objectModeration`
- `services.contentModels.contentModeration`

## Contains

No other pattern: every property is a value or a reference.

## References

- `moderatedProperties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
