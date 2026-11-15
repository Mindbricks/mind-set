# EventSubBasics

**Level:** `section` · **Family:** [EventSubscription](../ontology/families.md#eventsubscription) (domain `Service`)

**Ontology:** [EventSubBasics in Part 1](../ontology/EventSubBasics.md)

Core identity of the event subscription. The name becomes the namespace path `/<service>-api/events/{name}` for WebSocket transport (a Socket.IO namespace on Node.js) or the SSE endpoint `/<service>-api/events/{name}/stream` for SSE transport, `<service>-api` being the owning service's public route.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique subscription identifier within the service. Used in the WebSocket namespace (`/<service>-api/events/{name}`) or SSE endpoint (`/<service>-api/events/{name}/stream`). Must be a valid code name (camelCase): validation converts a kebab-case value, so 'order-tracking' is stored and served as 'orderTracking'. Examples: 'dashboard', 'productUpdates', 'orderTracking'. |
| `description` | `Text` | no |  |  |  | Human-readable description of the subscription's purpose. Used in documentation and AI assistant context. |
| `transport` | `EventSubTransport` | no | `"websocket"` | `websocket`, `sse` |  | The transport protocol for this subscription. Use 'websocket' for long-lived connections (finance dashboards, live tickers, admin panels) where clients dynamically subscribe/unsubscribe. Use 'sse' for short-lived, page-scoped connections (product page updates, order tracking) that open on page load and close on navigation. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `transport` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
