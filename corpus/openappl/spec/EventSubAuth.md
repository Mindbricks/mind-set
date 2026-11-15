# EventSubAuth

**Level:** `section` · **Family:** [EventSubscription](../ontology/families.md#eventsubscription) (domain `Service`)

**Ontology:** [EventSubAuth in Part 1](../ontology/EventSubAuth.md)

Authorization configuration for this event subscription. Default auth derives from each topic's DataObject access level -- public topics are open, protected topics require authentication (+ tenant filtering in multi-tenant), private topics require ownership (or admin role if no ownership field exists). The designer can add absoluteRoles to bypass all checks, checkRoles to gate access, and custom MScript auth/filter logic.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `absoluteRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | List of role names (from session.roleId) that bypass ALL authorization checks. Users with any of these roles receive all topics in the subscription without filtering. Examples: ['superAdmin'], ['superAdmin', 'systemAdmin']. |
| `checkRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | List of role names REQUIRED to use this subscription. If defined, users whose roleId is NOT in this list are rejected entirely. Use to restrict subscriptions to specific user tiers. Examples: ['admin', 'tenantAdmin', 'salesManager']. Leave empty to allow all authenticated users. |
| `authScript` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript evaluated at subscribe time for each requested topic, after the role and access-level checks (absoluteRoles holders are checked by it too). Must return a boolean. Context: 'session' (user session), 'topicName' (the authored Kafka topic string), 'dataObjectName' (the DataObject name). Return false to reject the topic for this user (reason `Rejected by auth script`); a script that throws rejects it too (reason `Auth script error`, logged). Compiled into the generated service at build time. Example: `{ "js": "session.subscriptionLevel >= 2 \|\| dataObjectName == 'PublicFeed'" }`. |
| `filterScript` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript evaluated for each incoming Kafka event before delivery, after the default owner / tenant filter. Must return a boolean. Context: 'session' (user session), 'topicName' (the authored Kafka topic string), 'dataObjectName' (the DataObject name), 'data' (the event record, the envelope's data), 'event' (the whole event envelope: id, type, source, time, requestId, actor, data, old). Return false to skip this event for this user. A script that throws skips the event for that user (logged, rate-limited); the stream itself keeps running. Compiled into the generated service at build time. Example: `{ "js": "data.priority >= session.minPriority" }`. |

## Constraints

Property rules:

- `absoluteRoles`, `checkRoles` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
