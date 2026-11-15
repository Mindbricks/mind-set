# ServiceHook

**Level:** `section` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [ServiceHook in Part 2](../spec/ServiceHook.md)

One lifecycle hook of the service library: runs the referenced library function (a `functions[]` entry of the SAME service) automatically when the service starts or gracefully stops. Startup hooks are the designer-facing way to run one-shot boot work — e.g. an idempotent boot data migration that reads records from a peer service and upserts rows locally before first reads serve traffic — without the cron-BusinessApi workaround (which re-runs forever and first fires at the first tick, not at boot). SEMANTICS: run-every-boot. There is NO persisted run-once marker in this iteration, so the referenced function must be IDEMPOTENT — it will run again on every restart, rolling deploy and crash recovery. FAILURE POSTURE: each hook is try/caught and logged by the generated bootstrap; a hook that throws never blocks the health endpoint and never crashes boot (same posture as the boot logger and the boot alter-sync). A startup hook is awaited after db/kafka wiring and before the HTTP listener binds, under a boot budget (`LIBRARY_STARTUP_HOOK_BUDGET_MS`, default 30000 ms) — past the budget, boot proceeds while the hook keeps running in the background.

## Contained in

- [ServiceLibrary](./ServiceLibrary.md) as `hooks` (a list)

Blueprint paths:

- `services.library.hooks`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
