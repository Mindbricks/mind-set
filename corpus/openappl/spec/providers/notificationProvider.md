# Provider catalog: notificationProvider

Entries of this family are written with [`NotificationProvider`](../NotificationProvider.md); the keys below are what an entry's `configuration` takes, per `provider` brand.

**Behaviour rules:** what every compiler must do for this family beyond the keys (webhook signatures, field rules, documented quirks) is in [notificationProvider behaviour](../../guides/providers/notification.md).

## Environment names

| Prefix | Key style |
|---|---|
| `NOTIFICATION_PROVIDER` | `verbatim` |

The key style `upperSnake` turns a camelCase key into UPPER_SNAKE; `verbatim` keeps it as written.

## Brands

| Brand | Keys | Required | Secret |
|---|---|---|---|
| [`smtp`](#smtp) | 7 | 5 | 1 |
| [`sendgrid`](#sendgrid) | 2 | 2 | 1 |
| [`resend`](#resend) | 2 | 2 | 1 |
| [`amazonsns`](#amazonsns) | 4 | 3 | 2 |
| [`amazonses`](#amazonses) | 4 | 4 | 2 |
| [`mailgun`](#mailgun) | 4 | 3 | 1 |
| [`postmark`](#postmark) | 3 | 2 | 1 |
| [`twilio`](#twilio) | 4 | 2 | 1 |
| [`vonage`](#vonage) | 3 | 2 | 1 |
| [`netgsm`](#netgsm) | 3 | 3 | 1 |
| [`firebase`](#firebase) | 3 | 3 | 1 |
| [`onesignal`](#onesignal) | 2 | 2 | 1 |
| [`telegram`](#telegram) | 3 | 1 | 2 |
| [`whatsapp`](#whatsapp) | 6 | 2 | 3 |

## Credentials

| Entry | Value |
|---|---|
| `overlayFamily` | notification |
| `credentialSets` | true |
| `credentialModes` | ["auto","sandbox","live","mock"] |
| `mockCredentialMode` | allowed |
| `mockBrand` |  |
| `liveDetection` | none |
| `credentialScopes` | ["saas"] |
| `scopeField` |  |
| `note` | Mock runs the sinks (email, SMS, WhatsApp, Telegram, push); the SMS and channel sinks keep their slot rule and never run in production. |

## smtp

**Channels:** `email`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `emailHost` | string |  | yes |  |  |  | SMTP host. |
| `emailPort` | number |  | yes |  |  |  | SMTP port. |
| `emailUser` | string |  | yes |  |  |  | SMTP username. |
| `emailPass` | string | yes | yes |  |  |  | SMTP password. |
| `isSecure` | boolean |  |  |  |  |  | Use TLS/SSL. |
| `rejectUnauthorized` | boolean |  |  |  |  |  | Verify the server TLS certificate. Defaults to true; set false only for a mock/self-signed endpoint (the built-in mail-sink). |
| `emailFrom` | string |  | yes |  |  |  | Default From address. |

## sendgrid

**Channels:** `email`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `sendGridApiKey` | string | yes | yes |  |  |  | SendGrid API key. |
| `emailFrom` | string |  | yes |  |  |  | Default From address. |

## resend

**Channels:** `email`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `resendApiKey` | string | yes | yes |  |  |  | Resend API key. |
| `emailFrom` | string |  | yes |  |  |  | Default From address. |

## amazonsns

**Channels:** `sms`, `push`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `awsAccessKeyId` | string | yes | yes |  |  |  | AWS access key id. Credential material: delivered as a deploy secret, never compiled into the service. |
| `awsSecretAccessKey` | string | yes | yes |  |  |  | AWS secret access key. |
| `awsRegion` | string |  | yes |  |  |  | AWS region. |
| `platformApplicationArn` | string |  |  |  |  |  | Push channel only: the SNS platform application (FCM or APNs) the project's device tokens belong to, e.g. arn:aws:sns:eu-central-1:111111111111:app/GCM/myApp. A raw device token is registered against it with CreatePlatformEndpoint before the publish; without it a push can only address an SNS platform-endpoint ARN. |

## amazonses

**Channels:** `email`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `awsAccessKeyId` | string | yes | yes |  |  |  | AWS access key id. Credential material: delivered as a deploy secret, never compiled into the service. |
| `awsSecretAccessKey` | string | yes | yes |  |  |  | AWS secret access key. |
| `awsRegion` | string |  | yes |  |  |  | AWS region of the SES identity (e.g. eu-central-1). |
| `emailFrom` | string |  | yes |  |  |  | Verified SES From address (or an address on a verified domain). |

## mailgun

**Channels:** `email`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `mailgunApiKey` | string | yes | yes |  |  |  | Mailgun API key. |
| `mailgunDomain` | string |  | yes |  |  |  | Mailgun sending domain (e.g. mg.example.com). |
| `emailFrom` | string |  | yes |  |  |  | Default From address. |
| `mailgunBaseUrl` | string |  |  |  |  |  | API base URL; set https://api.eu.mailgun.net for EU-hosted domains. |

## postmark

**Channels:** `email`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `postmarkServerToken` | string | yes | yes |  |  |  | Postmark server token. |
| `emailFrom` | string |  | yes |  |  |  | Postmark-verified sender signature From address. |
| `postmarkMessageStream` | string |  |  |  |  |  | Message stream id; defaults to the transactional 'outbound' stream. |

## twilio

**Channels:** `sms`, `whatsapp`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `twilioAccountSid` | string |  | yes |  |  |  | Twilio account SID. |
| `twilioAuthToken` | string | yes | yes |  |  |  | Twilio auth token. |
| `twilioSender` | string |  |  |  |  |  | Default SMS sender (number/alphanumeric). |
| `whatsappFrom` | string |  |  |  |  |  | WhatsApp sender (whatsapp:+... ) for the whatsapp channel. |

## vonage

**Channels:** `sms`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `vonageApiKey` | string |  | yes |  |  |  | Vonage API key. |
| `vonageApiSecret` | string | yes | yes |  |  |  | Vonage API secret. |
| `vonageSender` | string |  |  |  |  |  | Default SMS sender. |

## netgsm

**Channels:** `sms`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `netgsmUsername` | string |  | yes |  |  |  | Netgsm username. |
| `netgsmPassword` | string | yes | yes |  |  |  | Netgsm password. |
| `netgsmSender` | string |  | yes |  |  |  | Sender header (msgheader) approved on the Netgsm account. Required: Netgsm refuses a send whose header is not defined on the account (result code 40). |

## firebase

**Channels:** `push`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `firebaseProjectId` | string |  | yes |  |  |  | Firebase project id. |
| `firebaseClientEmail` | string |  | yes |  |  |  | Service-account client email. |
| `firebasePrivateKey` | text | yes | yes |  |  |  | Service-account private key (PEM). |

## onesignal

**Channels:** `push`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `oneSignalApiKey` | string | yes | yes |  |  |  | OneSignal REST API key. |
| `oneSignalAppId` | string |  | yes |  |  |  | OneSignal app id. |

## telegram

**Channels:** `telegram`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `telegramBotToken` | string | yes | yes |  |  |  | Telegram bot token. Also the outbound credential of every aiAgent chat surface or mcpbff exposure bound to this provider (chat bots are retired). |
| `telegramApiBase` | string |  |  |  |  |  | Telegram API base URL override. |
| `telegramWebhookSecret` | string | yes |  |  |  |  | The secret token Telegram presents (X-Telegram-Bot-Api-Secret-Token, the setWebhook secret_token) on the webhook of the aiAgent surface or mcpbff exposure bound to this provider; without it that webhook refuses every update (fails closed). Not needed for outbound-only use. |

## whatsapp

**Channels:** `whatsapp`

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `whatsappAccessToken` | string | yes | yes |  |  |  | WhatsApp Cloud API access token. Also the outbound credential of the aiAgent chat surface or mcpbff exposure bound to this provider (chat bots are retired). |
| `whatsappPhoneNumberId` | string |  | yes |  |  |  | WhatsApp phone number id. |
| `whatsappApiVersion` | string |  |  |  |  |  | Graph API version the sends and the chat replies post through (default v20.0). |
| `whatsappApiBase` | string |  |  |  |  |  | WhatsApp API base URL override. |
| `whatsappAppSecret` | string | yes |  |  |  |  | Meta app secret. Verifies the X-Hub-Signature-256 of every webhook Meta posts to this provider's ONE inbound door on the notification service (POST /v1/whatsapp-webhooks/meta/<name>: inbound customer messages for the agents and bots bound to this provider, delivery statuses for the delivery log, other field changes); without it the door refuses everything (503). The only place the secret lives: an aiAgent surface or mcpbff exposure names this provider and carries no secret of its own. |
| `whatsappVerifyToken` | string | yes |  |  |  |  | The verify token you enter when subscribing this provider's inbound door (GET /v1/whatsapp-webhooks/meta/<name>, hub.verify_token handshake) in the Meta app dashboard; without it the subscription is refused. |
