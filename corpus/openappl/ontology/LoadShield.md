# LoadShield

**Level:** `chapter` · **Family:** [LoadShield](./families.md#loadshield) (domain `Service`)

**Specification:** [LoadShield in Part 2](../spec/LoadShield.md)

The service's single in-process priority load shedder (docs/ADR-loadshield-priority-load-shedding.md) — an always-on guard for the WHOLE service against UNPLANNED overload, modeled on Uber's Cinnamon. Declared at most ONCE per service as `service.loadShield` (a singular optional chapter — the shoppingCartConfig idiom, NOT an array: the shield guards ONE shared resource, the service's DB pool + event loop, so two shields would fight over the same budget). At runtime a bounded priority queue sits IN FRONT of route dispatch: every request gets an effective priority from its declared/derived tier (0 = never shed … 5 = first to shed) plus a per-caller cohort (stable within a time-rotation period — the cohort salt time-rotates with a per-caller staggered phase, ADR §13, so the shed-first lottery is redrawn across load events instead of being drawn once forever), a CoDel-style queue-wait bound (`targetQueueLatencyMs`) detects congestion, and shed requests get an immediate DB-free HTTP 429 + Retry-After with errorCode LOAD_SHED. The blueprint surface is deliberately minimal (D6, the zero-config property): tier assignments + the setpoint + enabled/exemptions ONLY — PID gains, cohort count, queue capacity and every other controller internal are platform code constants, never blueprint. CONTRAST `waitingRooms[]` (an opt-in, client-visible PULL queue a designer places in front of ONE known-stampede API for a PLANNED spike): the two compose — the room meters the herd upstream, the shield still protects the service if admitted-rate + background traffic saturates the DB. `eventStream` ingest keeps its OWN declared shedding and is structurally exempt. The nodejs runtime makes the chapter REAL: an active shield emits `src/load-shield-layer/` (static route-table config + middleware + adaptive controller) and mounts it after the session parse and ahead of every business route — a shed is answered before ANY DB work and before the waitingRoom QueToken gate consumes a one-shot token. ADAPTIVE MODE (ADR D7): on a service with a relational pool the shield closes the loop over the shared DB-saturation signal — a PID controller walks a rejection threshold down the 384-point tier×cohort priority scale (worst priorities shed first, IMMEDIATELY on arrival, cohort-granular so partial tiers shed before whole tiers; floor at the tier-1 band start — tier 0 is structurally unsheddable) and an AIMD auto-tuner moves the concurrency cap between internal bounds as the database's measured capacity changes. All controller gains, bounds and cadences are INTERNAL platform constants — never blueprint, never a design tool. Without a relational DB signal the shield automatically degrades to the static behavior. Runtime ops knobs (env, not blueprint): `LOADSHIELD_DISABLED=true` bypasses the shield entirely; `LOADSHIELD_ADAPTIVE_DISABLED=true` keeps the shield on but pins the static degraded stance; `LOADSHIELD_COHORT_ROTATION_SECONDS` overrides the cohort-salt rotation period (default 3600, 0 = fixed pre-rotation mapping). Services that do not declare the chapter (or declare it with `enabled:false`) still generate byte-identical output.

## Contained in

- [Service](./Service.md) as `loadShield`

Blueprint paths:

- `services.loadShield`

## Contains

- `shieldBasics`: [LoadShieldBasics](./LoadShieldBasics.md)
- `tiers`: [LoadShieldTiers](./LoadShieldTiers.md)
- `exemptions`: [LoadShieldExemptions](./LoadShieldExemptions.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
