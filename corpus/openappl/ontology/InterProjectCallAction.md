# InterProjectCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [InterProjectCallAction in Part 2](../spec/InterProjectCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Calls a Business API in a linked sibling project in the same organization. Calls a Business API exposed by a LINKED SIBLING PROJECT — another OpenAPPL project in the same organization that was linked via addSiblingProject and therefore appears in the blueprint's `siblingProjects[]` registry. It is the cross-project counterpart of InterserviceCallAction (which calls a service inside the SAME project) and IntegrationAction (which calls a catalog integration). `targetProject` references the sibling by its codename (the designer-friendly form) or by its projectId; `targetApi` names a Business API published by that sibling. Parameters are passed as dynamically evaluated MScript key-value pairs, and the response — optionally narrowed to a single `responseProperty` — is stored in the context and can be written to the API response.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `interProjectCallActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.interProjectCallActions`
- `services.businessLogic.actions.interProjectCallActions`

## Contains

- `apiParameters`: [DataMapItem](./DataMapItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
