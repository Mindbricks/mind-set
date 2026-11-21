---
title: Guides
---

# Guides

The guides are the task-oriented half of the [language specification](../spec/index.md).
The pattern pages say what every property of `openappl.json` accepts; the guides say how
the patterns fit together when you write a blueprint, with worked JSON examples and the
rules that a valid blueprint has to respect.

Read them in this order the first time, then use them as a reference.

## Blueprint

How a blueprint is laid out, the type system and the naming rules.

- [Core concepts](./blueprint/concepts.md): patterns, blueprints, the type system, naming rules and reserved names.
- [Project structure](./blueprint/project-structure.md): the project root, its settings, authentication, notification and the list of services.
- [Services](./blueprint/services.md): what a service declares and which services are system services.
- [Dictionary](./blueprint/dictionary.md): the terms of the language, A to Z, and the preferred wording.
- [Secrets in a blueprint](./blueprint/secrets.md): the two standard spellings of a credential, `$ENV:NAME` and `ENTER_CREDENTIAL`, and the seeded super-admin password.
- [The service plan](./blueprint/service-plan.md): what `servicePlan` is and the one thing it changes.

## Data modelling

- [Overview](./data-modeling/overview.md), [Data objects](./data-modeling/data-objects.md), [Property types](./data-modeling/property-types.md), [Relations](./data-modeling/relations.md), [Indexes](./data-modeling/indexes.md).
- [DataObject capabilities](./data-modeling/object-capabilities.md), [Lifecycle and state](./data-modeling/lifecycle-and-state.md), [Multi-tenancy](./data-modeling/multi-tenancy.md), [Geography](./data-modeling/geography.md), [Database layer](./data-modeling/db-layer.md).

## Business APIs

- [Business API overview](./business-apis/overview.md), then one page per kind: [get](./business-apis/get-api.md), [list](./business-apis/list-api.md), [create](./business-apis/create-api.md), [update](./business-apis/update-api.md), [delete](./business-apis/delete-api.md), [bulk actions](./business-apis/bulk-actions.md).
- [Response shape](./business-apis/response-shape.md) and [ApiManager](./business-apis/api-manager.md), the pipeline every API runs.
- Other entry points: [Kafka controllers](./business-apis/kafka-controllers.md), [gRPC controllers](./business-apis/grpc-controllers.md), [SSE streaming](./business-apis/sse-streaming.md), [scheduled business](./business-apis/scheduled-business.md) and [cron controllers](./business-apis/cron-jobs.md).

## Workflow and actions

- [Overview](./workflow/overview.md), [Workflow context](./workflow/workflow-context.md), [Parallel and loops](./workflow/parallel-and-loops.md), [Race conditions](./workflow/race-conditions.md), [Error handling](./workflow/error-handling.md).
- [Actions](./actions/index.md): one page per action with its behaviour, limits and errors. Each action is also a pattern in the [pattern reference](../spec/all-patterns.md).

## Cookbook

Task recipes that combine patterns end to end: [AI agent](./cookbook/add-ai-agent.md), [cron job](./cookbook/add-cron-job.md), [payment checkout](./cookbook/add-payment-checkout.md), [realtime channel](./cookbook/add-realtime-channel.md), [file uploads](./cookbook/attach-file-uploads.md), [shopping cart](./cookbook/build-shopping-cart.md), [bulk import](./cookbook/bulk-import-excel-csv-file-upload.md), [notify on an event](./cookbook/notify-on-event.md), [the four ledger recipes](./cookbook/ledger-loyalty-points.md), [moderation](./cookbook/moderate-user-content.md), [share by link](./cookbook/share-a-record-by-link.md), [slugs](./cookbook/slugs-for-data-objects.md) and [a full worked example](./cookbook/worked-example-book-marketplace.md).

## Provider behaviour

What every compiler must do for a provider family, beyond the configuration keys: [notification](./providers/notification.md), [bucket](./providers/bucket.md), [payment](./providers/payment.md), [AI](./providers/ai.md), [fiscal](./providers/fiscal.md) [invoice](./providers/invoice.md), [decision](./providers/decision.md), [enterprise](./providers/enterprise.md), [mailbox](./providers/mailbox.md), [social login](./providers/social-login.md) and [video](./providers/video.md). Environment, console setup and go-live belong to the compiler's own operations material.

## MScript

The expression language used in every script slot.

- [Overview](./mscript/overview.md), [Syntax](./mscript/syntax.md), [Step context](./mscript/step-context.md), [Slot scopes](./mscript/slot-scopes.md).
- [Query reference](./mscript/query-reference.md), [Numeric mutation](./mscript/numeric-mutation.md), [Array mutation](./mscript/array-mutation.md), [Cookbook](./mscript/cookbook.md), [Trust model](./mscript/trust-model.md).

## System services

- [Overview](./system-services/overview.md), [Machine-to-machine communication](./system-services/m2m-communication.md), [BFF](./system-services/bff.md), [MCP-BFF](./system-services/mcpbff.md), [Notification](./system-services/notification.md), [Agent hub](./system-services/agent-hub.md), [Service tool registry](./system-services/application-mcp.md).
- Authentication: start with the [overview](./system-services/authentication/overview.md); then [login](./system-services/authentication/login.md), [social logins](./system-services/authentication/social-logins.md), [users](./system-services/authentication/users.md), [RBAC](./system-services/authentication/rbac.md), [PBAC](./system-services/authentication/pbac.md), [Business API authentication](./system-services/authentication/business-api-auth.md) and the rest of the section.

## Capabilities

Larger, self-contained features a blueprint can switch on: permissions and tenancy ([native permissions](./capabilities/native-permissions.md), [multi-tenancy](./capabilities/multi-tenancy.md)), content ([object moderation](./capabilities/object-moderation.md), [object visits](./capabilities/object-visits.md)), commerce ([shopping cart](./capabilities/shopping-cart.md), [payment workflow](./capabilities/payment-workflow.md), [ledger](./capabilities/ledger.md)), intelligence ([decision layer](./capabilities/decision-layer.md), [graph layer](./capabilities/graph-layer.md), [compute layer](./capabilities/compute-layer.md)), realtime ([realtime hub](./capabilities/realtime.md), [event subscriptions](./capabilities/event-subscriptions.md)) and integration ([external feeds](./capabilities/external-feeds.md), [AMQP broker mirror](./capabilities/amqp-broker-mirror.md)). The sidebar lists all of them.

## Composition patterns

How to combine several properties and actions to get a behaviour: [list options](./composition/list-options.md), [runtime list filters](./composition/runtime-list-filters.md), [static joins](./composition/static-joins.md), [membership](./composition/membership.md), [session-aware logic](./composition/session-aware-logic.md), [buckets](./composition/native-buckets.md), [ElasticLog](./composition/elastic-log.md) and more.

## Best practices

[Service boundaries](./best-practices/service-boundaries.md), [API design](./best-practices/api-design.md), [Permissions strategy](./best-practices/permissions-strategy.md), [Data modeling tips](./best-practices/data-modeling-tips.md), [Action composition](./best-practices/action-composition.md), [Kafka topic naming](./best-practices/kafka-topic-naming.md), [Rules the validator enforces](./best-practices/validator-rules.md), [Public SEO for a frontend](./best-practices/frontend-seo.md) and [Anti-patterns](./best-practices/anti-patterns.md).

## About the generated service

Several guides describe what the generated service does at run time (error shapes,
ordering, delivery guarantees) because an author depends on it. How a compiler produces
that behaviour is the subject of [Part 3, the compiler specification](../compiler/index.md).
