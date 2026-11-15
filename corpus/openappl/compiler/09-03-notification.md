---
title: Notification
---

# 9.3 Notification

The notification service delivers messages to users by email, SMS, push, WhatsApp,
Telegram and in-app notices, triggered by events or by actions.

## Activation

The compiler **MUST** generate a service named `notification` when any of these holds:

- `notificationService.eventNotifications` is not empty;
- an authentication verification flow is active ([9.1](09-01-authentication-and-sessions.md));
- a business API uses a send-mail, send-SMS, send-push or send-WhatsApp action;
- a WhatsApp provider, a chat binding, or a provider with chat handling is declared.

## Providers

Providers are declared once per project in
`projectSettings.notificationProvidersSettings.notificationProviders[]`, each with a
`name`, a `kind` (`email`, `sms`, `push`, `telegram`, `whatsapp`, `multi`), a `provider`
brand and its configuration. The brand list is a technical selector: a compiler that
does not support a brand refuses it ([chapter 1](01-conformance-model.md#15-profiles-and-compile-time-refusal)).

## Event notifications

An `EventNotification` says: on this event, send this template on this channel to these
targets.

| Part | Meaning |
|---|---|
| `eventNotificationBasics` | name, channel (`jobType`: `email`, `sms`, `push`, `telegram`, `whatsapp`, `inApp`), whether to store an in-app record, deep link, deduplication key, provider |
| `eventDataSettings` | the topic to listen to, optional data view to enrich the record, extra data |
| `targets[]` | who receives: a user id, an email, a phone, a device token, a role, a user group, read from the event or fixed |
| `template` | the message per language |

For each consumed event the service **MUST**: resolve the targets (a role or group is
expanded to its users), render the template per recipient, send through the provider,
and record the attempt. A template that lacks a required value **MUST NOT** be sent; the
attempt is recorded as failed.

- A user id target is resolved to an address from the user's record (email, phone,
  WhatsApp number, Telegram id).
- Delivery is at least once with a deduplication gate per notification, channel,
  recipient and deduplication key (the event `id` by default), so a redelivered event
  does not send twice.

> **To verify:** the exact user-record fields used for address lookup, per channel.

## Data objects

| Object | Content |
|---|---|
| `notification` | stored in-app notices (`isSeen`, `deliveredAt`, the deep link) |
| `notificationLog` | one record per attempt on every channel |
| `notificationDeliveryLog` | one record per provider send: `status`, `channel`, `providerName`, `messageId`, `errorMessage` |
| `deviceToken` | push tokens per user and device |

## Automatic APIs

| Family | Routes |
|---|---|
| Devices | `POST /register` (idempotent per user and device), unregister, `GET /devices` |
| In-app notices (when stored notices are on) | `GET /notifications`, `POST /notifications/:notificationId/seen` |
| Operators | `GET /admin/delivery-logs`, `GET /admin/notifications`, `POST /admin/notifications/:notificationId/resend` |

"My" lists always return the caller's own records, for every caller.

> Generated table goes here (S9): the notification route catalogue, including the
> geofencing and messaging-ingress routes.

## Fallback sinks

When a channel's provider has no complete credentials, the service **MUST NOT** fail at
start ([chapter 10](10-configuration-and-secrets.md#103-missing-provider-credentials)):

| Channel | Without credentials |
|---|---|
| Email | sent to a built-in mail sink instead of the provider, in every environment; production also logs an error |
| SMS, WhatsApp, Telegram, push | a sink outside production; in production the send fails at the provider. A project that declares no provider for the channel sends every message of that channel to the sink |

A sunk message is recorded with the sink as its provider.

## Events

The service consumes the topics its event notifications name and the authentication
flow topics. It publishes the ordinary data-change events of its own objects.

> **To verify:** whether the notification service raises any topic of its own.
