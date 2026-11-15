# Project

**Level:** `root` · **Family:** [Project](../ontology/families.md#project)

**Ontology:** [Project in Part 1](../ontology/Project.md)

Project is the root class representing the entire architecture of a software project in OpenAPPL. It sits at the top of the OpenAPPL ontology tree—a structured, semantic pattern definition scheme used to model projects. An OpenAPPL compiler leverages this ontology to generate applications (as microservices, a modular monolith or serverless functions, by the compiler's choice) by interpreting and compiling interconnected pattern objects. Each pattern object is defined as a class with typed properties, which can include both primitive types and references to other pattern classes. Projects are built as JSON instances that follow this schema, enabling AI agents and human architects to collaboratively define a system's structure, behavior, and deployment blueprint in a unified and machine-readable format.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `projectSettings` | [`ProjectSettings`](./ProjectSettings.md) | yes |  |  |  | Defines the general configuration of the project. This includes fundamental attributes like project name, description, and environmental setup. Recommended as the first section to complete when initializing a new project. |
| `authentication` | [`ProjectAuthentication`](./ProjectAuthentication.md) | yes |  |  |  | Configures the authentication and authorization mechanisms of the project. This module defines login models, session behavior, social logins, and access control. It is referenced by all services that require secure user management. |
| `bffService` | [`BFFService`](./BFFService.md) | yes |  |  |  | Defines the Back-For-Front (BFF) service that serves as a frontend aggregation layer. It composes data from multiple services and presents them in optimized formats for the frontend. |
| `notificationService` | [`NotificationService`](./NotificationService.md) | yes |  |  |  | Settings for configuring notification options at the project level so that a separte notification service can be used to send messages via email, SMS, or push notifications. This module defines the providers and event-driven behaviors for notifications. |
| `agentHub` | [`AgentHubConfig`](./AgentHubConfig.md) | no |  |  |  | Centralized AI agent management hub. Generates a dedicated service that hosts AI agents with cross-service tool access, runtime reconfiguration, and optional dynamic agent creation by end-users. Agents in the hub can use tools from any service in the project. |
| `enterpriseHub` | [`EnterpriseHubConfig`](./EnterpriseHubConfig.md) | no |  |  |  | Project-level enterprise-integration asset hub. Each EnterpriseModel binds to one connected enterprise platform (declared in projectSettings.enterpriseIntegrationsSettings) and catalogs the assets a designer works with — the external business objects, business events, and business actions — authored against the platform's metadata. Services then CONSUME these assets: a DataObject projects an enterpriseObject, a BusinessApi is triggered by an enterpriseEvent (via the SAP/AMQP→Kafka mirror), and an ExternalBusinessAction invokes an enterpriseAction. The mcpbff bridge is the runtime that talks to the platform; this hub is the design-time catalog. Peer of agentHub. |
| `services` | [`Service`](./Service.md)[] | no |  |  |  | Defines the individual microservices within the project. Each service includes its own data model, logic, and CRUD capabilities. All services are listed as an array of Service objects. |

## Constraints

Property rules:

- `projectSettings`, `authentication`, `bffService`, `notificationService` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `services` must have distinct names (`serviceSettings.serviceBasics.name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DUPLICATE_VALUE` | error | Duplicate siblingProject "…". |
| `INVALID_TYPE` | error | siblingProjects must be an array |
| `NOTIFICATION_PROVIDER_NOT_DECLARED` | error | Notification provider "…" is not declared in projectSettings.notificationProvidersSettings.notificationProviders[], so generating the notification service fails (UnknownNotificationProvider) instead of falling back to … |
| `PROJECT_CODENAME_LEGACY_POSITION` | error |  |
| `REQUIRED_FIELD_MISSING` | error | siblingProject requires a projectId or codename |
