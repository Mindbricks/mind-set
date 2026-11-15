# OptimizationSpec

**Level:** `subsection` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [OptimizationSpec in Part 2](../spec/OptimizationSpec.md)

Type-specific spec for `optimization` ComputeJobs — routing, scheduling, allocation, pricing, constraint solving. generatedNative problem + library solver: the intended OpenAPPL compiler contract includes the decision variables, constraints, objective, solver selection, and input/solution mapping plus explainability; the solver crate/package does the search. Presets: ConstraintSolverJob (`solver:CP`), PlanningService. This declaration describes the intended compute contract, not a guarantee that every field is executed. ComputeJob hosting is restricted to Rust/Python; Node.js does not host these jobs. Implementation of individual unresolved fields on supported hosts must be assessed separately.

## Contained in

- [ComputeJobSpec](./ComputeJobSpec.md) as `optimization`

## Contains

- `objective`: [OptimizationObjective](./OptimizationObjective.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
