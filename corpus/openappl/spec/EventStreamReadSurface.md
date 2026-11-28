# EventStreamReadSurface

**Level:** `section` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [EventStreamReadSurface in Part 1](../ontology/EventStreamReadSurface.md)

**Name:** an instance is named by `name`.

A generated read API over an EventStream's stores. Each surface is a query archetype selected via `type` and exposed as an api-layer route under `/<stream>/<name>`. Phase 3 wires the hot-store surfaces: `latestN` (the last-N records for a partition, ordered by the clustering column) and `currentState` (the single most-recent record for a partition).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Read-surface identifier — the generated route suffix (`/<stream>/<name>`) and the asset-name-path. Must be a valid codeName. |
| `type` | `String` | no | `"latestN"` |  |  | The read archetype: `latestN` (last-N records for one partition from the hot store, ordered by the clustering column DESC — the default), `currentState` (the single most-recent record for a partition), `historySince` (records since a timestamp — cold/hot, P4), `analyticsRollup` (a rollup query against the analytics store, P4), `replaySince` (replay records since a timestamp, P4). Kept as String in v1; Phase 3 emits latestN + currentState. |
| `partitionParam` | `String` | no |  |  |  | The route/query parameter that supplies the partition value (e.g. `vehicleId`). Defaults to streamBasics.partitionKey. |
| `rollup` | `String` | no |  |  |  | [analyticsRollup] Name of the analytics.rollups[] this surface reads. Defaults to the first declared rollup when absent. Ignored by non-analyticsRollup surfaces. |
| `defaultLimit` | `Integer` | no | `50` |  |  | [latestN] Default number of records returned when the request omits a limit. Defaults to 50. |
| `maxLimit` | `Integer` | no | `1000` |  |  | [latestN] Hard cap on the returned record count (guards a hot-store scan). Defaults to 1000. |
| `loginRequired` | `Boolean` | no | `true` |  |  | When true (default), the read route requires a valid login token. |
| `judgement` | [`DecisionPageJudgement`](./DecisionPageJudgement.md) | no |  |  |  | [latestN] Optional judged page (DecisionPageJudgement): a decision provider reranks or filters the records this surface would answer, in one provider request per page. Absent = the unjudged page, exactly as a surface without it answers. The judged surface clamps the request limit to the judgement's page cap, judges only rows the caller would have received unjudged, and answers a `judgement` attribution next to the items. Implemented for nodejs, rust, java, dotnet and python: another service language refuses the block (DECISION_PAGE_LANGUAGE_UNSUPPORTED), and only a `latestN` surface takes it (DECISION_PAGE_SURFACE_UNSUPPORTED). |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
