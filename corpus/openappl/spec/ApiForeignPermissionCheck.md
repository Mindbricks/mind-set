# ApiForeignPermissionCheck

**Level:** `subsection` · **Family:** [BusinessApiBasics](../ontology/families.md#businessapibasics) (domain `BusinessApi`)

**Ontology:** [ApiForeignPermissionCheck in Part 1](../ontology/ApiForeignPermissionCheck.md)

Per-BusinessApi foreign-permission question. `params` is a FREE MScript map (arbitrary keys; each value MScript evaluated against the api context `this`) sent to the project's `foreignPermissionProvider`. `denyMessage` is an optional manual 403 message overriding the provider's `messageFrom`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `params` | [`DataMapItem`](./DataMapItem.md)[] | no |  |  |  | The free MScript map sent to the permission server. Each entry maps a request key to an MScript expression evaluated against the api context (`this.session`, the read params, the fetched instance, etc.) — exactly the pattern GrpcCallAction.request.fields / ApiCallAction body params use. It is whatever the permission server expects; the framework does not interpret the keys. Merged with the provider's `sessionBindings` to form the request. |
| `denyMessage` | `String` | no |  |  |  | Optional manual user-facing 403 message. Takes precedence over the provider's `messageFrom(result)` when the check denies. Omit to let the provider derive the message. |

## Constraints

Property rules:

- The items of `params` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
