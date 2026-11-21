---
title: SendPushNotificationAction
---

# SendPushNotificationAction

`SendPushNotificationAction` sends a push notification to a mobile or web client via a configured native notification provider (FCM, OneSignal, ...). Title, body, and recipient are MScript expressions built from context. The action is a native integration: provider selection happens at design time by codename, and the action talks to the provider directly.

## When to use it

- In-app or mobile alerts: new message, status change, approval requested.
- Re-engagement nudges based on application state.
- Send to a known device token. Cross-device fan-out from a `userId` is the caller's responsibility; see Behaviour.

For email, SMS, or WhatsApp use the sibling actions: [`SendMailAction`](./send-mail-action.md), [`SendSmsAction`](./send-sms-action.md), [`SendWhatsAppAction`](./send-whatsapp-action.md). All four share the same provider-lookup shape.

A null, undefined, empty, or whitespace-only `to` is refused with
`ApiError(400, 'Notification recipient is empty')` before provider setup or sending.
The recipient expression is evaluated once, and a non-empty recipient is sent
as a string.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `provider` | `String` | ◐ | Codename of the configured push provider. Must match an entry in `projectSettings.notificationProvidersSettings.notificationProviders[].name` with `kind: "push"` (or `kind: "multi"`). Required (`REQUIRED_FIELD_MISSING`) when the project declares a push or `multi` provider; there is no fallback to a project default. May be omitted only in a project that declares no push provider: the action then sends to the built-in push sink on every deployment, production included, and validation warns once with `PUSH_FLOWS_GO_TO_SINK`. |
| `subject` | `MScript` | ✓ | Expression evaluating to the notification title, typically the bold heading on a mobile push alert. |
| `body` | `MScript` | ✓ | Expression evaluating to the notification body. Keep it concise and actionable. |
| `to` | `MScript` | ✓ | Expression evaluating to the recipient device token. The action does **not** resolve device tokens from a user id: the caller is responsible for looking up the right token(s) upstream and passing them in. For multi-device fan-out, run this action once per token (e.g. inside a [`LoopAction`](./loop-action.md)). |
| `from` | `MScript` |   | Optional sender or topic id used by some providers for routing/labelling. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

At runtime the action:

1. Resolves `provider` to an entry in `notificationProvidersSettings.notificationProviders[]` at compile time. With no `provider` in a project that declares no push provider, it resolves to the built-in last-resort `__pushsink__` entry instead (nothing is decided at runtime). If a named provider has no match, the action logs a runtime warning and is a no-op; project validation reports that name as `UNKNOWN_NOTIFICATION_PROVIDER`.
2. Lazily constructs the provider adapter bound to that entry. Credentials come from the per-provider settings supplied by the deployment.
3. Sends the resolved subject, body, and `to` device token through the provider.

A real provider failure throws `NotificationSendError`; the workflow stage wrapper handles it per `onActionError`.

> **Device-token resolution.** `SendPushNotificationAction` sends to whatever `to` resolves to, typically a device token. It does **not** look up device tokens from a user id. The notification service's own listener handler is the place that does that fan-out; from a transactional business-API workflow, resolve the device tokens upstream and pass them explicitly (e.g. fetch the `DeviceToken` rows with a [`FetchObjectAction`](./fetch-object-action.md) and iterate with a [`LoopAction`](./loop-action.md)).

## Example

Send to a single device token already resolved upstream:

```json
{
  "name": "notifyAssignee",
  "provider": "firebase",
  "subject": { "js": "`New task assigned to you`" },
  "body": { "js": "`${this.task.title} - due ${this.task.dueDate}`" },
  "to": { "js": "this.assigneeDeviceToken" }
}
```

Fan out across a user's devices: resolve the tokens first, then loop:

```json
"actions": {
  "fetchObjectActions": [
    {
      "name": "loadAssigneeTokens",
      "writeToResponse": false,
      "contextPropertyName": "assigneeTokens",
      "targetObject": "deviceToken",
      "whereClause": { "js": "({ userId: this.task.assigneeId })" },
      "isArray": true
    }
  ],
  "loopActions": [
    {
      "name": "pushToEachDevice",
      "loopFor": { "js": "this.assigneeTokens" },
      "loopItemName": "token",
      "actions": ["pushOne"]
    }
  ],
  "sendPushNotificationActions": [
    {
      "name": "pushOne",
      "provider": "firebase",
      "subject": { "js": "'New task'" },
      "body": { "js": "this.task.title" },
      "to": { "js": "this.token.token" }
    }
  ]
}
```

Only `loadAssigneeTokens` and `pushToEachDevice` are listed at a workflow milestone; the loop runs `pushOne` once per token.

## Errors

- `provider` not found in `notificationProvidersSettings.notificationProviders[]`: project validation reports `UNKNOWN_NOTIFICATION_PROVIDER` (a wrong `kind` is `INCOMPATIBLE_PROVIDER_KIND`); if generated anyway, the action logs a runtime warning and returns `false` (no-op).
- `to` does not resolve to a device token (e.g. the caller passed a `userId` expecting auto-resolution): the provider rejects with an opaque error. Resolve the device token upstream.
- Provider send failure: `NotificationSendError`; surfaced via `onActionError`.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`SendMailAction`](./send-mail-action.md), [`SendSmsAction`](./send-sms-action.md), [`SendWhatsAppAction`](./send-whatsapp-action.md): sibling notification actions.
- Push providers (Firebase, OneSignal, Amazon SNS): [notification providers](../providers/notification.md).
