# InvoiceCapabilities

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [InvoiceCapabilities in Part 2](../spec/InvoiceCapabilities.md)

Per-entry capability flags for an InvoiceProvider. Each flag advertises what the underlying provider can do behind this named entry; the framework gates design-time bindings accordingly and the runtime adapter refuses calls outside the advertised set. Defaults are derived from the `provider` enum value when this block is omitted. Set a flag to false to intentionally narrow capabilities — e.g. disable collection on an entry whose invoices are settled outside the platform.

## Contained in

- [InvoiceProvider](./InvoiceProvider.md) as `capabilities`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
