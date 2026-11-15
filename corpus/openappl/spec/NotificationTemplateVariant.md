# NotificationTemplateVariant

**Level:** `subsection` · **Family:** [EventNotification](../ontology/families.md#eventnotification) (domain `NotificationService`)

**Ontology:** [NotificationTemplateVariant in Part 1](../ontology/NotificationTemplateVariant.md)

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `language` | `String` | yes |  |  |  | The language this variant is written in, as a BCP-47-ish tag: `en`, `tr`, `de`, or a regional tag such as `pt-BR`. Compared case-insensitively against the recipient's language, and a recipient tag falls back to its base subtag (`tr-TR` selects a `tr` variant). Must be unique across the template's variants. |
| `subjectTemplate` | `Text` | no |  |  |  | This language's subject line. Same render scope and the same REQUIRED-local rules as the template's own `subjectTemplate`: metadata keys at TOP LEVEL, plus `_old`, `_actor`, `actionDeepLink`, `actionText`, `dataSource`, and `recipient` when `renderPerRecipient` is on. Leave empty only if this language deliberately has no subject - it does NOT fall back to the template's subject, because variant selection is WHOLE-TEMPLATE (a recipient gets this variant's two slots or the fallback's two slots, never one of each). |
| `bodyTemplate` | `Text` | no |  |  |  | This language's body. Same render scope and the same REQUIRED-local rules as the template's own `bodyTemplate`. Leave empty only if this language deliberately has no body - it does NOT fall back to the template's body, because variant selection is WHOLE-TEMPLATE. |
| `whatsappTemplate` | [`NotificationWhatsAppTemplate`](./NotificationWhatsAppTemplate.md) | no |  |  |  | This language's WhatsApp template (same shape as NotificationTemplate.whatsappTemplate). Used for recipients whose language selects this variant; its `language` defaults to this variant's `language` (a `-` becomes `_`, so `pt-BR` is sent as `pt_BR`). When a variant declares none, its recipients get the template's own whatsappTemplate with this variant's language as the default code - the usual Meta shape, where ONE template name is approved in several languages. Declare one here when this language uses a different template name or a different Twilio Content SID. |

## Constraints

Property rules:

- `language` must be present. (`REQUIRED_FIELD_MISSING`)
