# BasicProjectSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [BasicProjectSettings in Part 2](../spec/BasicProjectSettings.md)

Defines the basic settings of your OpenAPPL project, including its identity, descriptive metadata, environment variables, and current lifecycle stage. These values are essential for naming, documentation, and runtime configuration.

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `basicSettings`

Blueprint paths:

- `projectSettings.basicSettings`

## Contains

- `customVariables`: [DataMapSimpleItem](./DataMapSimpleItem.md), a list
- `frontendUrl`: [FrontendUrl](./FrontendUrl.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
