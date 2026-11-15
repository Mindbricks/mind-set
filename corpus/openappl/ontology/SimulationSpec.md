# SimulationSpec

**Level:** `subsection` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [SimulationSpec in Part 2](../spec/SimulationSpec.md)

Type-specific spec for `simulation` ComputeJobs — Monte Carlo, agent/state-step, time-series simulation. hybrid/generatedNative: the intended OpenAPPL compiler contract includes the MC/state/time-step loop, seed handling, scenario config, parallel exec, and aggregation. Presets: MonteCarloJob (`method:monte-carlo`), ForecastingJob. This declaration describes the intended compute contract, not a guarantee that every field is executed. ComputeJob hosting is restricted to Rust/Python; Node.js does not host these jobs. Implementation of individual unresolved fields on supported hosts must be assessed separately.

## Contained in

- [ComputeJobSpec](./ComputeJobSpec.md) as `simulation`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
