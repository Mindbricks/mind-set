# DecisionPageJudgement

**Level:** `subsection` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [DecisionPageJudgement in Part 2](../spec/DecisionPageJudgement.md)

Reranks or filters one bounded page of a read surface with a decision provider, in one provider request per page. Each item reaches the provider only as its declared state projection (`stateFields`), addressed by its stable id (`idField`), and the judged page is always a subset (filter) or a reordering (rerank) of the page the surface would have answered unjudged: a judgement can never add an item. A `filter` asks one noul per item and keeps the items whose probability reaches `confidenceThreshold`; a `rerank` asks one score per item against the ordered `criteria` and sorts by it, ties keeping the original order. The failure rule: a filter fails closed (the request fails, or answers the empty page under `matchNothing`) and never answers the unfiltered page; a rerank may keep the original order (`keepOrder`, its default). A page is never split into several requests, never retried and never truncated: a page over `pageCap` (framework hard maximum 256 items) or over the provider's token budget is not judged and takes the failure rule. The response carries a `judgement` attribution (mode, provider, model, judged, degraded) so a degraded page is never served as judged. Never an authorization surface (DECISION_ON_AUTHZ_SURFACE). Bound today to an `EventStreamReadSurface` of type `latestN`, implemented for nodejs, rust, java and dotnet.

## Contained in

- [EventStreamReadSurface](./EventStreamReadSurface.md) as `judgement`

## Contains

- `criteria`: [DataMapSimpleItem](./DataMapSimpleItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
