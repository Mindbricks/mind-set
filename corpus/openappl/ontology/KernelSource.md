# KernelSource

**Level:** `subsection` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [KernelSource in Part 2](../spec/KernelSource.md)

A fetchable reference to one source file (or archive) of the existing native library a `NativeKernel` wraps. Designers work through the web and the AI agent, never a local filesystem, so source is never inlined — it is uploaded to the platform bucket (preferred) or hosted at a URL/git remote, and codegen downloads it into the service's `native/` folder at generation time. Use this only for libraries not available via a package manager; otherwise provision the library through the shared `serviceBasics.packages[]` and reference it via `links`/`includes`.

## Contained in

- [CustomSpec](./CustomSpec.md) as `source`
- [NativeKernel](./NativeKernel.md) as `sources` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
