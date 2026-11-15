# WhatsAppTemplateButton

**Level:** `subsection` · **Family:** [EventNotification](../ontology/families.md#eventnotification) (domain `NotificationService`)

**Ontology:** [WhatsAppTemplateButton in Part 1](../ontology/WhatsAppTemplateButton.md)

One button of an approved WhatsApp template (Meta). DOCUMENTATION ONLY: printed in the project's DevOps guide for the template's submission to Meta; never sent at runtime.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `type` | `WhatsAppTemplateButtonType` | no | `"quick_reply"` | `quick_reply`, `url`, `phone_number` |  | The button type: `quick_reply` (a reply button carrying `text`), `url` (opens `url`) or `phone_number` (calls `phoneNumber`). |
| `text` | `String` | yes |  |  |  | The button label, exactly as approved. |
| `url` | `String` | no |  |  |  | `url` buttons only: the target URL as approved (a dynamic URL may end in `{{1}}`). |
| `phoneNumber` | `String` | no |  |  |  | `phone_number` buttons only: the number to call, in international format (e.g. `+905551112233`). |

## Constraints

Property rules:

- `text` must be present. (`REQUIRED_FIELD_MISSING`)
- `type` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
