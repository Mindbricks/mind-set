# SimulationSpec

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [SimulationSpec in Part 1](../ontology/SimulationSpec.md)

Type-specific spec for `simulation` ComputeJobs — Monte Carlo, agent/state-step, time-series simulation. hybrid/generatedNative: the intended OpenAPPL compiler contract includes the MC/state/time-step loop, seed handling, scenario config, parallel exec, and aggregation. Presets: MonteCarloJob (`method:monte-carlo`), ForecastingJob. This declaration describes the intended compute contract, not a guarantee that every field is executed. ComputeJob hosting is restricted to Rust/Python; Node.js does not host these jobs. Implementation of individual unresolved fields on supported hosts must be assessed separately.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `method` | `String` | no |  |  |  | Simulation method: `monte-carlo\|discrete-event\|agent\|time-step`. Kept as String in v1. |
| `model` | `String` | no |  |  |  | The state/step body of the simulation (generatedNative MScript/native — String in v1). |
| `iterations` | `Integer` | no |  |  |  | Number of iterations / scenarios to run. |
| `seed` | `Integer` | no |  |  |  | Random seed for reproducibility. |
| `scenarioConfig` | `String` | no |  |  |  | Scenario configuration (parameter ranges/distributions) — String in v1. Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `aggregation` | `String` | no |  |  |  | How per-iteration outputs are aggregated into the result (String in v1). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
