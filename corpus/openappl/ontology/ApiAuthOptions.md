# ApiAuthOptions

**Level:** `section` · **Family:** [BusinessApiBasics](./families.md#businessapibasics) (domain `BusinessApi`)

**Specification:** [ApiAuthOptions in Part 2](../spec/ApiAuthOptions.md)

Defines core authentication and authorization settings for a Business API. These settings cover session validation, role and ownership checks, and access scope (e.g., tenant vs. SaaS-level). While these options are sufficient for most use cases, more fine-grained access control—such as conditional permissions or contextual ownership—should be implemented using explicit access control actions (e.g., `PermissionCheckAction`, `MembershipCheckAction`, `ObjectPermissionCheckAction`).

## Contained in

- [BusinessApiBasics](./BusinessApiBasics.md) as `authOptions`

Blueprint paths:

- `authentication.businessLogic.basics.authOptions`
- `services.businessLogic.basics.authOptions`

## Contains

- `parentOwnershipChecks`: [ApiParentOwnershipCheck](./ApiParentOwnershipCheck.md), a list
- `foreignPermissionCheck`: [ApiForeignPermissionCheck](./ApiForeignPermissionCheck.md)
- `permissionCheck`: [ApiPermissionCheck](./ApiPermissionCheck.md)
- `requireApproval`: [ApiApprovalRequirement](./ApiApprovalRequirement.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
