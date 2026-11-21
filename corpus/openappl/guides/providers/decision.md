# Decision provider behavior

A decision provider returns the judgment for an authored decision. The caller applies its configured failure policy. A list predicate with `onProviderError: failClosed` fails a request when the provider is unavailable. `matchNothing` selects no candidates. Preserve the distinction between an outage and a successful decision.

See the [configuration keys](../../spec/providers/decisionProvider.md) and the [related guide](../capabilities/decision-layer.md).

## Operations

Use the compiler's operations guide for environment and console setup.

For the Genesis compiler, these operations (environment variables, console configuration, credential setup, webhook registration and the go-live checklist) are in the `genesis-set` package, which installs next to mind-set.
