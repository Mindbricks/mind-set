# ApiParentOwnershipCheck

**Level:** `subsection` · **Family:** [BusinessApiBasics](./families.md#businessapibasics) (domain `BusinessApi`)

**Specification:** [ApiParentOwnershipCheck in Part 2](../spec/ApiParentOwnershipCheck.md)

One PARENT-ownership gate for a Business API. At runtime the generated manager fetches the parent row and DENIES (403) unless the caller owns it. `parentObject` names the parent DataObject (in THIS service) whose row is fetched by id; `parentIdField` is the request field carrying that parent row's id; `ownerField` is the session-bound owner property ON the parent object compared against the caller's session userId. Distinct from `ownershipCheck` (which gates the target row itself) — use this for create-under-parent and modify-child-if-you-own-the-parent. LANGUAGE NOTE: every selectable service language emits this gate (nodejs, java, python, dotnet, golang and rust), on every api shape, golang DataView reads (apiOptions.dataViewName on a list or get api) and serviceLayerCall apis included. On the retired php lane, which carries no such gate, a declared parentOwnershipChecks list is the non-bypassable validation error PARENT_OWNERSHIP_UNSUPPORTED_LANGUAGE. The language is the one the service is built in, a build-language override included.

## Contained in

- [ApiAuthOptions](./ApiAuthOptions.md) as `parentOwnershipChecks` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
