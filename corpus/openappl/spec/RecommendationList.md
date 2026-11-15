# RecommendationList

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [RecommendationList in Part 1](../ontology/RecommendationList.md)

**Name:** an instance is named by `name`.

One recommendation list of an item object (recommendation ADR section 4). It declares the list kind, the evidence relations that feed it, how pairs are scored, how much is precomputed and served, the deterministic filters and list policy, and the engine and refresh schedule. Presets (bought together, readers also read, trending) are authoring presets that expand into an ordinary list; they are not ontology.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The list name, unique on the object: it names the serving route (`.../recommendations/<name>`), the `_rec.list` label of every served item, and a fallback reference. It does not key the precomputed rows: the shared neighbor / popularity tables are keyed by the relation key (relation, source set, window), so lists that resolve to the same key share rows. E.g. `boughtTogether`. |
| `kind` | `RecommendationListKind` | yes |  | `related`, `complementary`, `personalized`, `next`, `trending`, `buyAgain` |  | What the list is anchored on (RecommendationListKind): `related`, `complementary` and `next` take an anchor item; `personalized` and `buyAgain` take the actor; `trending` is global. Nodejs, dotnet and java emit `personalized`, `buyAgain` and `next`; other language runtimes retain RECOMMENDATION_NOT_YET_EMITTED (warning) for those kinds until ported. Their actor lists first select the latest 500 raw actor events per evidence source in its tenant scope, then apply validWhen and windowDays. Seed selection and repeat frequency/recency are bounded approximations: invalid events occupy the budget and older repeats can be omitted. The fixed runtime constant is RECOMMENDATION_ACTOR_EVENT_WINDOW. Missing declared-source actor/time indexes can still require a database scan or sort; RECOMMENDATION_ACTOR_HISTORY_INDEX_MISSING warns for discoverable same-table source paths without a full-domain leading actor/time composite index. |
| `evidence` | [`RecommendationEvidence`](./RecommendationEvidence.md)[] | no |  |  |  | The relations that feed the list, each with its source and weight. Blending relations is explicit, never silent, and the response names the relation that produced each item. |
| `scoring` | `RecommendationScoring` | no | `"cosine"` | `count`, `cosine`, `jaccard`, `lift`, `llr` |  | How co-occurrence pairs are scored (RecommendationScoring). Default `cosine`: popularity-normalized, so an item bought everywhere does not top every list. |
| `windowDays` | `Integer` | no |  |  |  | How far back, in days, interactions count. Null removes the age cutoff. Nodejs, dotnet and java personalized and buyAgain still select only the latest 500 raw actor events per evidence source before applying validity and this age cutoff. |
| `decayHalfLifeDays` | `Integer` | no |  |  |  | Half-life, in days, of popularity and actor-list recency decay. Each interaction contributes `weight * 0.5^(ageDays / halfLife)` to popularity; null or omission disables popularity decay. Nodejs, dotnet and java `personalized` and `buyAgain` use the latest interaction time and default to 30 days when null or omitted. Other list kinds and language runtimes retain RECOMMENDATION_NOT_YET_EMITTED (warning) for unsupported non-popularity decay. |
| `minSupport` | `Integer` | no | `3` |  |  | Minimum number of co-occurrences before a pair exists. Default 3. |
| `maxGroupSize` | `Integer` | no | `50` |  |  | Groups (baskets, sessions) larger than this are sampled, which bounds the pair blow-up. Default 50. |
| `storedNeighbors` | `Integer` | no | `50` |  |  | Top-K neighbors kept per item in the neighbor table. Default 50. |
| `size` | `Integer` | no | `10` |  |  | Items returned per request. Default 10; the `fallback` lists fill a short list up to it. |
| `filters` | [`RecommendationFilters`](./RecommendationFilters.md) | no |  |  |  | Deterministic filters re-applied to every candidate at serve time (RecommendationFilters). Neighbor tables are stale by up to one refresh, so a precomputed neighbor is never returned without passing them, the item's read gate and the item get api's whereClause. A row rule of the get api that reads a request parameter cannot be applied by the list (it closes the list); express it here instead. |
| `listPolicy` | [`RecommendationListPolicy`](./RecommendationListPolicy.md) | no |  |  |  | Diversity and dedupe rules applied to the filtered, ranked page (RecommendationListPolicy). |
| `rerank` | [`RecommendationRerank`](./RecommendationRerank.md) | no |  |  |  | Optional bounded, fail-open rerank of the filtered candidate page by a decision provider (RecommendationRerank). Emitted by slice R5; until then a declared value is reported as RECOMMENDATION_NOT_YET_EMITTED (warning). |
| `fallback` | `String`[] | no |  |  |  | Names of other lists of this object, tried in order while this list returns fewer than `size` items. |
| `engine` | `RecommendationEngine` | no | `"sql"` | `sql`, `clickhouse`, `compute`, `graph` |  | What computes the list's table (RecommendationEngine). Default `sql`, the only engine emitted in R1; `clickhouse`, `compute` and `graph` arrive with slice R6, until then a declared value is reported as RECOMMENDATION_NOT_YET_EMITTED (warning). |
| `refreshCron` | `String` | no | `"0 */6 * * *"` |  |  | Cron schedule of the refresh job that recomputes the list's table. Default every six hours. |
| `api` | [`RecommendationApi`](./RecommendationApi.md) | no |  |  |  | Serving-route options (RecommendationApi). Null serves the list on the default route behind the item's read gate: the item get api's login, roles and ownership, its whereClause applied to every candidate (on a get api with no id parameter the whereClause is a ROW FILTER: every matching candidate is served, not the get api's first row; the latest-record fallback restricts nothing), and the response redaction that get api applies to its answer (the removeFromResponse actions placed in its afterBuildOutput stage, conditional ones included) applied to every served item. |
| `logImpressions` | `Boolean` | no | `true` |  |  | Record every served item as a `seen` impression with its position and the `listRequestId`, the basis of click-through evaluation. Default true. Nodejs, dotnet and java write the final served page (after the filters, the fallback and the size limit) as `seen` rows with zero-based positions and one `listRequestId` per response, after the response and fail-open; it needs visitTracking with history on the item object (without history nothing is recorded). Language runtimes without the R2 slice do not record impressions yet. |

## Constraints

Property rules:

- `name`, `kind` must be present. (`REQUIRED_FIELD_MISSING`)
- `kind`, `scoring`, `engine` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `RECOMMENDATION_DECAY_HALF_LIFE_INVALID` | error | Recommendation list "…": decayHalfLifeDays must be a positive finite integer in days. |
| `RECOMMENDATION_NOT_YET_EMITTED` | warning | Recommendation list "…": … … is accepted but not generated yet: slice … of the recommendation family emits it, and until it lands the list does not honour it. |
