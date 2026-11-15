# SendPushNotificationAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [SendPushNotificationAction in Part 1](../ontology/SendPushNotificationAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Sends a push notification using a configured provider (e.g., Firebase, OneSignal). Subject and body are rendered via MScript and sent to the recipient device or user ID. Suitable for in-app or mobile alerts.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Codename of the configured push provider. Must match an entry in `projectSettings.notificationProvidersSettings.notificationProviders[].name` with `kind: 'push'` (or `kind: 'multi'`). The action handler imports the matching native-integration client from `_common/notification-providers/push/<resolvedProvider>` and calls `provider.send(payload)` directly — for `targetKind: 'userId'` it first fetches DeviceToken rows via cross-service RPC to the notification service. Required (REQUIRED_FIELD_MISSING) when the project declares a push-capable (push / multi) provider: there is no project-default fallback on this action. May be omitted only in a project that declares NO push provider: the action then sends to the built-in push sink on every deployment, production included (wired at build time), validation warns once with PUSH_FLOWS_GO_TO_SINK listing the action, and the service gets the mail sink coordinate (MAILSINK_*) on preview and stage. An unresolvable name throws `UnknownNotificationProvider`; a kind mismatch throws `IncompatibleProviderKind` at project-validation time. When the named provider's credentials are not set, the send goes to the built-in push sink on the dev, preview and stage deployments (stored in the mail sink as a mail to `push-<token hash>@push-sink.invalid`) and fails on production. |
| `subject` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | The notification title or heading, rendered via MScript. This typically appears as the bold title on a mobile push alert. |
| `body` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | The body text of the notification, defined via MScript. Should be concise and actionable. |
| `to` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | The recipient device ID or user identifier, evaluated from context. Format depends on the configured provider. |
| `from` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional sender or topic ID. Used to label or route notifications by source when supported by the provider. |

## Constraints

Property rules:

- `subject`, `body`, `to` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

## Example

Use to send a mobile/in-app push via a configured provider (Firebase, OneSignal) to a user or device id — order updates, mentions, alerts.

```json
{
  "name": "pushOrderShipped",
  "description": "Notify the customer's devices that their order has shipped.",
  "provider": "firebasePush",
  "to": { "js": "this.order.customerId" },
  "subject": { "js": "'Your order is on the way!'" },
  "body": { "js": "`Order ${this.order.number} has shipped and will arrive in 2-3 days.`" }
}
```
