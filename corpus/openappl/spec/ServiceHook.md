# ServiceHook

**Level:** `section` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [ServiceHook in Part 1](../ontology/ServiceHook.md)

**Name:** an instance is named by `name`.

One lifecycle hook of the service library: runs the referenced library function (a `functions[]` entry of the SAME service) automatically when the service starts or gracefully stops. Startup hooks are the designer-facing way to run one-shot boot work — e.g. an idempotent boot data migration that reads records from a peer service and upserts rows locally before first reads serve traffic — without the cron-BusinessApi workaround (which re-runs forever and first fires at the first tick, not at boot). SEMANTICS: run-every-boot. There is NO persisted run-once marker in this iteration, so the referenced function must be IDEMPOTENT — it will run again on every restart, rolling deploy and crash recovery. FAILURE POSTURE: each hook is try/caught and logged by the generated bootstrap; a hook that throws never blocks the health endpoint and never crashes boot (same posture as the boot logger and the boot alter-sync). A startup hook is awaited after db/kafka wiring and before the HTTP listener binds, under a boot budget (`LIBRARY_STARTUP_HOOK_BUDGET_MS`, default 30000 ms) — past the budget, boot proceeds while the hook keeps running in the background.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique name of this hook within the library's `hooks` list. Used in boot logs (`StartupHookCompleted` / `StartupHookFailed` / `ShutdownHookFailed`). |
| `trigger` | `ServiceHookTrigger` | yes |  | `startup`, `shutdown` |  | When the hook fires. `startup`: awaited by the generated bootstrap on every boot, after the database, migrations, seed data and kafka wiring are up and before the HTTP listener binds. `shutdown`: best-effort on the graceful-shutdown path (SIGTERM/SIGINT), bounded by `LIBRARY_SHUTDOWN_HOOK_BUDGET_MS`; a killed process runs nothing, so never rely on a shutdown hook for correctness. |
| `moduleName` | `String` | yes |  |  |  | The `moduleName` of a `functions[]` entry of THIS service's library. The generated bootstrap invokes that module's exported function with no arguments (the same callable MScript reaches as `LIB.<moduleName>(...)`); the function may be async and must be idempotent. Design-time validation errors when no library function with this name exists (`HOOK_MODULE_NOT_FOUND`). |
| `description` | `Text` | no |  |  |  | Human-readable explanation of what this hook does. |

## Constraints

Property rules:

- `name`, `trigger`, `moduleName` must be present. (`REQUIRED_FIELD_MISSING`)
- `trigger` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
