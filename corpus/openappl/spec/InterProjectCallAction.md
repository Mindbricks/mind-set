# InterProjectCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [InterProjectCallAction in Part 1](../ontology/InterProjectCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Calls a Business API in a linked sibling project in the same organization. Calls a Business API exposed by a LINKED SIBLING PROJECT — another OpenAPPL project in the same organization that was linked via addSiblingProject and therefore appears in the blueprint's `siblingProjects[]` registry. It is the cross-project counterpart of InterserviceCallAction (which calls a service inside the SAME project) and IntegrationAction (which calls a catalog integration). `targetProject` references the sibling by its codename (the designer-friendly form) or by its projectId; `targetApi` names a Business API published by that sibling. Parameters are passed as dynamically evaluated MScript key-value pairs, and the response — optionally narrowed to a single `responseProperty` — is stored in the context and can be written to the API response.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `targetProject` | `String` | yes |  |  |  | The linked sibling project that exposes the target Business API. Reference the sibling by its codename (designer-friendly) or by its projectId — it must resolve to an entry of the blueprint's `siblingProjects[]` registry, i.e. the project must first be linked with addSiblingProject. |
| `targetApi` | `String` | yes |  |  |  | The name of the Business API published by the sibling project to call. |
| `apiParameters` | [`DataMapItem`](./DataMapItem.md)[] | no |  |  |  | A list of key-value MScript expressions passed as input parameters to the target API. These are dynamically evaluated using the current context. |
| `responseProperty` | `String` | no |  |  |  | If defined, only the specified property will be extracted from the target API response; otherwise the full response body is stored. It indexes the PRODUCER'S RESPONSE BODY, which under the unified response contract is the record itself at the root (with `_type`) for a single-item target — there is NO resource-named wrapper, so a value like `order` or `profile` on a get/create/update/delete target matches nothing and silently falls back to the whole body. Valid values are a record property (or an `addToResponse`/`writeToResponse` key) on a single-item target, or `data` / `paging` on a LIST target, whose body is the AIP `{ data, paging }` envelope. Leave it unset to store the whole record — that is the normal choice for a single-item call. |
| `isArray` | `Boolean` | yes |  |  |  | If true, the result is expected to be an array. This influences how the response is processed and stored. |
| `forwardCallerToken` | `Boolean` | yes |  |  |  | When `true`, the caller forwards the inbound end-user's identity to the sibling project alongside the cross-project M2M trust token: the raw caller bearer rides `Authorization: Bearer <token>` and the verified session identity (userId / email / roleId / tenantId / sessionId) is embedded as a claim inside the project-key-signed `x-project-m2m-token`. Forwarding it does NOT decide that it is applied. The receiving project decides, and by default it refuses: the claim is applied only when the callee sets `ACCEPT_FORWARDED_IDENTITY` (default unset = reject, the call runs as pure machine-to-machine), and even then three rules bound it. (1) The claim is an identity or it is nothing: a claim that names no user contributes NO field at all, so a forwarded `roleId`, `tenantId` or `sessionId` without a `userId` grants nothing, scopes nothing and cannot make the caller non-anonymous to the ownership gates. (2) Only scalar slots cross; a non-scalar value in any slot is dropped before the claim is read. (3) The claim is never applied over an identity boundary: if the receiving request ALREADY carries its own authenticated session and that session is not provably the same user, the claim is refused whole and the request proceeds exactly as it would have with the opt-in switched off, under the local user, with `ForwardedIdentityNotPropagated` logged. An optional `FORWARDED_ROLE_CEILING` allowlist additionally caps which roleIds may be assumed. (4) A claim that MOVES the tenant does not bring the previous tenant's scoped members with it: `tenantCodename` and `userGroupIdList` are CLEARED on the merged session, because a tenant codename that no longer matches the tenant id is a false binding and a user-group id issued inside one tenant grants nothing inside another. Both clear fail-closed - the codename falls back to the request's own resolved tenant and an empty group list simply matches no group-scoped permission - so a workflow reading `this.session.userGroupIdList` on a forwarded cross-tenant call must treat the empty list as no group-scoped authority rather than as an error. When the claim IS applied the sibling acts on the user's identity (audit fields, ownership checks, user-scoped business logic). When `false` (default) the call is pure machine-to-machine: the sibling sees no user session and the target API must allow M2M callers (`M2MAllowed`). Set `true` whenever the sibling API should run under the original user's identity rather than as a machine caller, and remember that the sibling must opt in for it to have any effect. |

## Constraints

Property rules:

- `targetProject`, `targetApi`, `isArray`, `forwardCallerToken` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `apiParameters` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `API_NOT_FOUND` | error | API "…" is not published by sibling project "…". |
| `SIBLING_AMBIGUOUS` | warning | Sibling reference "…" matches … linked sibling projects (duplicate codename). |
| `SIBLING_NOT_FOUND` | error | Project "…" is not a linked sibling of this project. |

## Example

Use to call a Business API published by a linked sibling project (same organization) — first link the target with addSiblingProject, then reference it here by its codename (or projectId). Parameters are MScript-computed and the result lands on context.

```json
{
  "name": "fetchCustomerProfile",
  "description": "Fetch the shared customer profile from the linked crmbackend project.",
  "targetProject": "crmbackend",
  "targetApi": "getCustomerProfile",
  "apiParameters": [
    {
      "name": "customerId",
      "value": { "js": "this.data.customerId" }
    }
  ],
  "isArray": false,
  "contextPropertyName": "customerProfile"
}
```
