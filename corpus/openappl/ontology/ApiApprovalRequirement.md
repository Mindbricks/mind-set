# ApiApprovalRequirement

**Level:** `subsection` · **Family:** [BusinessApiBasics](./families.md#businessapibasics) (domain `BusinessApi`)

**Specification:** [ApiApprovalRequirement in Part 2](../spec/ApiApprovalRequirement.md)

The step-up approval requirement of one Business API: the channel of its one-time code, the input binding, the code lifetime and the action text the message shows. It is the value of `authOptions.requireApproval`. The api answers 403 APPROVAL_REQUIRED until the caller repeats the same request with `api-approval-id` and `api-approval-code`; see ApiAuthOptions.requireApproval for the pipeline position, the doors and the failure shapes.

## Contained in

- [ApiAuthOptions](./ApiAuthOptions.md) as `requireApproval`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
