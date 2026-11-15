# JobStreamState

**Level:** `section` · **Family:** [JobStream](../ontology/families.md#jobstream) (domain `Service`)

**Ontology:** [JobStreamState in Part 1](../ontology/JobStreamState.md)

Configures a job stream's durable status record and result link. The durable job record config of a JobStream (section): the `store` backing the status lifecycle (queued→started→[progress]→ended; DB by default) and `resultLinkField` — the field on the `ended` event that carries the result reference/link the frontend navigates to.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `store` | `String` | no | `"db"` |  |  | Where the durable job record lives: `db` (default — a durable, queryable job-state row, mirroring the sys_computeEvent outbox precedent) or `redis` (fast, ephemeral). Kept as String in v1. |
| `resultLinkField` | `String` | no |  |  |  | Default name of the field carried in the terminal `ended` event that holds the result reference/link the frontend navigates to (e.g. `reportUrl`). Overridden per-binding by targetApi.resultLinkField. When neither is set, the whole target result is attached to `ended`. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
