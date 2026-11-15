# ServiceBasics

**Level:** `section` · **Family:** [ServiceSettings](./families.md#servicesettings) (domain `Service`)

**Specification:** [ServiceBasics in Part 2](../spec/ServiceBasics.md)

Provides core identifiers and metadata for the service. Includes the service's internal ID, a unique name (used in code, routing, and service naming), a descriptive text for documentation, and any custom variables required for runtime configuration.

## Contained in

- [ServiceSettings](./ServiceSettings.md) as `serviceBasics`

Blueprint paths:

- `services.serviceSettings.serviceBasics`

## Contains

- `customVariables`: [DataMapSimpleItem](./DataMapSimpleItem.md), a list
- `packages`: [Package](./Package.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
