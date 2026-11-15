# FiscalCapabilities

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [FiscalCapabilities in Part 2](../spec/FiscalCapabilities.md)

Per-entry capability flags for a FiscalProvider. Each flag advertises what the provider and its network can do behind this named entry; the framework gates design-time bindings accordingly and the runtime adapter refuses calls outside the advertised set. Defaults are derived from the `provider` enum value when this block is omitted. The three MODE flags (clearance / exchange / reporting) are independent on purpose — one entry can serve several regimes, and the jurisdiction policy routes each document to a mode per its own rules (Turkey is itself hybrid: the same integrator entry produces an EXCHANGE route for registered e-invoice buyers and a REPORTING route for everyone else).

## Contained in

- [FiscalProvider](./FiscalProvider.md) as `capabilities`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
