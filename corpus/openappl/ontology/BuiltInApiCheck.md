# BuiltInApiCheck

**Level:** `chapter` · **Family:** [BuiltInApiCheck](./families.md#builtinapicheck) (domain `ProjectAuthentication`)

**Specification:** [BuiltInApiCheck in Part 2](../spec/BuiltInApiCheck.md)

One validation check attached to a built-in auth API at one step of its workflow (see `authentication.builtInApiChecks`). The check runs after the built-in actions of that step and refuses the call with its own `errorStatus` and `errorMessage` when it fails.

## Contained in

- [ProjectAuthentication](./ProjectAuthentication.md) as `builtInApiChecks` (a list)

Blueprint paths:

- `authentication.builtInApiChecks`

## Contains

- `validation`: [ValidationAction](./ValidationAction.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
