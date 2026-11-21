---
title: Send a welcome email on signup
---

# Send a welcome email on signup

A transactional email that fires when the auth service writes a new
`User` row. Three pieces: a configured notification provider, a
`NotificationTemplate`, and an `EventNotification` keyed on the
`User.created` Kafka topic.

> **Audience.** AI agent or human author wiring a "send X when Y
> happens" flow. Assumes a configured auth service and the notification
> service module enabled on the project.

## Prerequisites

- An auth service in the project (it owns the `User` data object and
  publishes the `created` event).
- The notification module enabled (`notificationService` is one of
  the four system service modules; its toggle lives at the project root).
- An SMTP-capable provider account (SES, SendGrid, SMTP relay, etc.).

## Step 1: configure the provider

Under `projectSettings.notificationProvidersSettings`:

```json
{
  "projectSettings": {
    "notificationProvidersSettings": {
      "notificationProviders": [
        {
          "name":     "transactional",
          "kind":     "email",
          "provider": "sendgrid",
          "configuration": [
            { "name": "emailFrom",     "value": "no-reply@example.com" },
            { "name": "sendGridApiKey", "value": "..." }
          ]
        }
      ]
    }
  }
}
```

`name` is the lookup key the rest of the project references. Secret
values are masked in API responses.

To make this provider the default for email events, set it on the
notification service options:

```json
{
  "notificationService": {
    "serviceSettings": {
      "serviceOptions": {
        "defaultEmailProviderName": "transactional"
      }
    }
  }
}
```

## Step 2: wire the event notification

Append to `notificationService.eventNotifications`:

```json
{
  "eventNotificationBasics": {
    "name":    "welcomeOnSignup",
    "jobType": "email",
    "isStored": true
  },
  "triggerSource": "kafka",
  "eventDataSettings": {
    "channel":      "<project>-auth-service-dbevent-user-created",
    "dataViewName": "userSignupDataView"
  },
  "targets": [
    {
      "targetName":       "newUser",
      "targetKind":       "userId",
      "targetPathInData": "id",
      "isArray":          false
    }
  ],
  "template": {
    "name":            "welcomeEmail",
    "subjectTemplate": "Welcome, <%= dataSource.firstName %>!",
    "bodyTemplate":    "<p>Hi <%= dataSource.firstName %>,</p><p>Thanks for signing up.</p>",
    "parser":          "ejs"
  }
}
```

What's going on here:

- `triggerSource: "kafka"` listens on the topic named in
  `eventDataSettings.channel`. DataObject DB-level events use the
  pattern `<serviceCodename>-dbevent-<objectname>-<verb>`, where
  `serviceCodename` is `<projectCodename>-<serviceName>-service`:
  for a project codename `acme` whose auth service owns the `User`
  data object, that's `acme-auth-service-dbevent-user-created`. (The
  broker's `elastic-index-*` topics are the compiler's internal
  index-sync family: subscribe there only when you specifically need
  post-materialization timing; they fire after the Elasticsearch
  write, are best-effort, and exist only for indexed objects.) See
  [Kafka topic naming](../best-practices/kafka-topic-naming.md).
- `targets[]` resolves recipients from the rendered notification data.
  `targetKind: "userId"` lets the service look up the user's email
  through the auth service; set `targetKind: "email"` only when the
  payload already carries the address directly (notifying non-users,
  newsletter opt-ins, etc.).
- `template` is written in the engine named by `parser` (`ejs` here).
  Variables resolve against the notification metadata
  keys at TOP LEVEL: the triggering event record's own fields, spread
  directly into the render scope, plus `_old`, `_actor`,
  `actionDeepLink`, `actionText`, and (only when the event declares
  `eventDataSettings.dataViewName`) `dataSource`, the whole fetched
  DataView document as one nested object. So write `<%= fullname %>`,
  not `<%= dataSource.fullname %>` or `<%= user.fullname %>`, unless a
  DataView really is declared and you mean the joined document.
- Every bare root the template reads is a REQUIRED local. If the bound
  context does not carry it, the delivery is refused and the missing
  local is named in the failed row: nothing is sent, even if the other
  slot rendered. Guard a local that is legitimately sometimes absent
  with `typeof someLocal !== 'undefined'`. See
  [notification template locals](../system-services/notification-template-locals.md).
- `isStored: true` writes one row per delivery to the
  `NotificationLog` index. The retention window is governed by the
  notification service's `serviceOptions.notificationLogRetentionDays`
  (default 7).

## Step 3: verify

Once the compiled service is running, sign up a test user and confirm:

1. The auth service emitted `<project>-auth-service-dbevent-user-created`.
2. The notification consumer rendered the template and called the
   email provider.
3. A new row exists in the `notificationLog` index with status
   `delivered` or `failed`.

Watch the notification service logs for `notification.send.success` /
`notification.send.failed` lines; both carry the
`eventNotificationName` and the `targetName` so failures are easy to
attribute.

## Variations

- **Gate by user property.** Add an
  `eventDataSettings.condition` MScript that returns false to skip:
  `this.dataSource.isVerified === true` ships email only to verified
  signups.
- **Locale-keyed template.** Define one EventNotification per locale;
  use a separate `condition` per entry
  (`this.dataSource.locale === 'fr'`). Each entry can point at its own
  template body.
- **Mind the condition receiver.** A `condition` reads its data through
  `this.`, and the receiver carries exactly five members:
  `this.payload`, `this.dataSource`, `this.old`, `this.actor`,
  `this.metadata`. There is no implicit scope, so a bare
  `dataSource.isVerified` is an evaluation error, not a fold to false.
  See the `EventDataSettings.condition` slot in
  [`EventDataSettings`](../../spec/EventDataSettings.md).
- **Different recipients.** Notify an internal alias instead of the
  user: set `targetKind: "email"` and `targetPathInData:
  "@'support@example.com'"` (a literal MScript string), or point at a
  field on the payload that holds the address.
- **Other channels.** Swap `jobType` to `"sms"`, `"push"`,
  `"telegram"`, or `"whatsapp"` and choose a compatible provider; the
  rest of the wiring is identical.

## See also

- [Notification service](../system-services/notification.md)
- [Event subscriptions](../capabilities/event-subscriptions.md)
- [Kafka topic naming](../best-practices/kafka-topic-naming.md)
- Reference: [`EventNotification`](../../spec/EventNotification.md), [`NotificationProvider`](../../spec/NotificationProvider.md), [`NotificationTemplate`](../../spec/NotificationTemplate.md), [`NotificationTarget`](../../spec/NotificationTarget.md)
