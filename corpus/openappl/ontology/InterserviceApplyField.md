# InterserviceApplyField

**Level:** `subsection` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [InterserviceApplyField in Part 2](../spec/InterserviceApplyField.md)

A guarded single-field update on another service's record, applied through that service's typed update API, where the field NAME is computed at runtime and whitelisted at design time. It is the `applyField` block of an InterserviceCallAction and replaces its `apiParameters`: the generated request carries exactly one data key, the field `field` evaluated to, set to `value`, on the record `recordId` names. Design-time rules: the target API must be an `update` API (INTERSERVICE_APPLY_FIELD_TARGET_NOT_UPDATE) whose effective REST route carries exactly one `:segment` and that segment is its id segment, `:id` or `:` followed by the data object name and `Id` (INTERSERVICE_APPLY_FIELD_TARGET_NOT_ID_ADDRESSED); its write set must be statically known, so an update API with no dataClauseItems, an action-carried write, an unresolvable data object or no declared request parameters is refused (INTERSERVICE_APPLY_FIELD_TARGET_SURFACE_UNKNOWN); every `allowedFields` entry must be in that write set (INTERSERVICE_APPLY_FIELD_NOT_UPDATABLE); `apiParameters` must be empty (INTERSERVICE_APPLY_FIELD_WITH_API_PARAMETERS); `transport` must not be `grpc` (INTERSERVICE_APPLY_FIELD_TRANSPORT_UNSUPPORTED); the calling service must generate in nodejs, rust, java or dotnet (INTERSERVICE_APPLY_FIELD_LANGUAGE_UNSUPPORTED; the python and golang emitters do not implement it yet). Runtime refusals, all before any token or I/O: 400 INTERSERVICE_APPLY_FIELD_NOT_ALLOWED for a `field` result that is not a string or not exactly one of the allowed fields, 400 INTERSERVICE_APPLY_FIELD_VALUE_UNDEFINED for an undefined `value`, 400 INTERSERVICE_PATH_PARAM_UNBOUND for a null or blank `recordId`. The target's own authorization still decides whether the call may update the record.

## Contained in

- [InterserviceCallAction](./InterserviceCallAction.md) as `applyField`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
