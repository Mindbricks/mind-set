# Project

**Level:** `root` · **Family:** [Project](./families.md#project)

**Specification:** [Project in Part 2](../spec/Project.md)

Project is the root class representing the entire architecture of a software project in OpenAPPL. It sits at the top of the OpenAPPL ontology tree—a structured, semantic pattern definition scheme used to model projects. An OpenAPPL compiler leverages this ontology to generate applications (as microservices, a modular monolith or serverless functions, by the compiler's choice) by interpreting and compiling interconnected pattern objects. Each pattern object is defined as a class with typed properties, which can include both primitive types and references to other pattern classes. Projects are built as JSON instances that follow this schema, enabling AI agents and human architects to collaboratively define a system's structure, behavior, and deployment blueprint in a unified and machine-readable format.

## Contained in

Nothing: this is the root of every blueprint.

## Contains

- `projectSettings`: [ProjectSettings](./ProjectSettings.md)
- `authentication`: [ProjectAuthentication](./ProjectAuthentication.md)
- `bffService`: [BFFService](./BFFService.md)
- `notificationService`: [NotificationService](./NotificationService.md)
- `agentHub`: [AgentHubConfig](./AgentHubConfig.md)
- `enterpriseHub`: [EnterpriseHubConfig](./EnterpriseHubConfig.md)
- `services`: [Service](./Service.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
