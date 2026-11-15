# BFFService

**Level:** `module` · **Family:** [BFFService](./families.md#bffservice)

**Specification:** [BFFService in Part 2](../spec/BFFService.md)

Configuration settings for the BFF (Backend-for-Frontend) service in the project. Although optional, a BFF service is highly recommended in microservice architectures to consolidate and simplify data access for frontend clients. Since data is distributed across services, the BFF service acts as a unified interface, retrieving and aggregating data from different sources. An OpenAPPL compiler supports a hybrid CQRS strategy where complex aggregations, defined as DataViews, can be stored and queried efficiently via Elasticsearch. Alternatively, lightweight aggregations can be executed dynamically using dynamic DataViews, which merge data from services at request time without persisting the result. Use Sttaic DataViews for performance-critical or cross-service filtered views, and Dynamic DataViews for dynamic, user-specific aggregations. If no DataViews are defined, the BFF service will not be generated for the project.

## Contained in

- [Project](./Project.md) as `bffService`

Blueprint paths:

- `bffService`

## Contains

- `serviceSettings`: [BffServiceSettings](./BffServiceSettings.md)
- `dataViews`: [DataView](./DataView.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
