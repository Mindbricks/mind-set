# OptimizationSpec

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [OptimizationSpec in Part 1](../ontology/OptimizationSpec.md)

Type-specific spec for `optimization` ComputeJobs — routing, scheduling, allocation, pricing, constraint solving. generatedNative problem + library solver: the intended OpenAPPL compiler contract includes the decision variables, constraints, objective, solver selection, and input/solution mapping plus explainability; the solver crate/package does the search. Presets: ConstraintSolverJob (`solver:CP`), PlanningService. This declaration describes the intended compute contract, not a guarantee that every field is executed. ComputeJob hosting is restricted to Rust/Python; Node.js does not host these jobs. Implementation of individual unresolved fields on supported hosts must be assessed separately.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `decisionVariables` | `String`[] | no |  |  |  | List of decision variables the solver optimizes over. Kept as String entries in v1. Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `constraints` | `String`[] | no |  |  |  | List of constraints the solution must satisfy. Kept as String entries in v1. |
| `objective` | [`OptimizationObjective`](./OptimizationObjective.md) | no |  |  |  | The objective function (sense + expression) — OptimizationObjective. |
| `solver` | `String` | no |  |  |  | Solver backend: `or-tools\|scipy\|pulp\|custom`. Kept as String in v1. |
| `timeLimit` | `String` | no |  |  |  | Wall-clock time limit for the solve (e.g. `30s`). Kept as String in v1. Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `inputMapping` | `String` | no |  |  |  | Mapping of job input onto the problem's data (String/MScript in v1). |
| `solutionMapping` | `String` | no |  |  |  | Mapping of the solver's solution onto the result summary (String/MScript in v1). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `explainability` | `Boolean` | no |  |  |  | When true, an explanation of the solution (binding constraints, sensitivity) is produced. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
