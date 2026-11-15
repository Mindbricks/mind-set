# PropertySessionSettings

**Level:** `section` · **Family:** [DataProperty](./families.md#dataproperty) (domain `DataObject`)

**Specification:** [PropertySessionSettings in Part 2](../spec/PropertySessionSettings.md)

Defines how this property is populated from the session context when this block is populated. Session-driven properties are commonly used to associate records with the current user automatically. The binding is applied on CREATE: on the main dataObject of a create Business API, and on a child row written by another API's CreateCrudAction or CreateBulkCrudAction, which fills any session-bound column its own mappings do not name. An UPDATE does not refresh the column - map it in the update dataClause to change it. On either create path an authored mapping wins, and a session that carries no value leaves the key ABSENT, so a required column refuses the row rather than being written null. Leave the wrapping object null when no session-binding is configured.

## Contained in

- [DataProperty](./DataProperty.md) as `sessionSettings`

Blueprint paths:

- `authentication.userProperties.sessionSettings`
- `authentication.tenantProperties.sessionSettings`
- `authentication.dataObjects.properties.sessionSettings`
- `services.dataObjects.properties.sessionSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
