---
title: RenderDataAction
---

# RenderDataAction

`RenderDataAction` substitutes `${key}` placeholders in a literal template string with values pulled from `inputData`, and writes the rendered string into the workflow context. The output is just a string, typically an email body, a short HTML fragment, or a piece of Markdown, that downstream actions consume. For binary PDFs use [`RenderPdfAction`](./render-pdf-action.md); for file serialization (CSV, JSON, TXT) use [`DataToFileAction`](./data-to-file-action.md).

## When to use it

- Render a short email body or notification string before handing it to [`SendMailAction`](./send-mail-action.md) / [`SendSmsAction`](./send-sms-action.md).
- Compose a formatted summary string for the response payload.
- Build a piece of templated text that is then attached to a downstream action.

For anything more structured than flat `${key}` substitution (loops, conditionals, nested values), build the string with an MScript expression in [`AddToContextAction`](./add-to-context-action.md), or fan out per-row with [`ListMapAction`](./list-map-action.md) and `.join(...)`.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `inputData` | `MScript` | ✓ | Expression evaluating to the flat key-value object whose keys back the `${...}` placeholders. Example: `({ name: this.user.name, code: this.order.code })`. |
| `template` | `String` | ✓ | A literal template string containing `${key}` placeholders. Substitution is a single pass; unknown keys substitute to the empty string. There is no template engine, no Markdown engine, and no template-library lookup: `template` is the literal text, not a reference. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties. The rendered string is written under `contextPropertyName` and made available as `this.<contextPropertyName>` to subsequent actions.

## How it works

The compiled `inputData` expression is evaluated and every placeholder of the form `${identifier}` in the literal `template` is replaced with the string form of the matching key of that object; a key that is absent (undefined) becomes the empty string. There is no expression evaluation inside `${...}`, only flat key lookup. Nested paths (`${user.name}`) and any non-identifier characters between `${` and `}` are **not** supported.

Like every action, the output is only added to the response when `writeToResponse: true` is set.

## Example

Render a short confirmation string and pass it to a follow-up [`SendMailAction`](./send-mail-action.md):

```json
"renderDataActions": [
  {
    "name": "buildBody",
    "writeToResponse": false,
    "contextPropertyName": "emailBody",
    "inputData": { "js": "({ name: this.user.firstName, code: this.order.code, total: this.order.total })" },
    "template": "Hi ${name},\n\nYour order ${code} is confirmed for ${total}.\n\nThanks for shopping with us."
  }
],
"sendMailActions": [
  {
    "name": "sendConfirmation",
    "writeToResponse": false,
    "provider": "sendgrid",
    "to": { "js": "this.user.email" },
    "subject": { "js": "`Order ${this.order.code} confirmed`" },
    "body": { "js": "this.emailBody" }
  }
]
```

Exception to the non-object fallback in Errors: strings and arrays expose `length` and canonical numeric keys such as `${0}`. For example, `${0}/${length}` with input `"abc"` renders `a/3`. Other absent properties still become empty strings; null, numbers and booleans expose none.

## Validation

- `RENDER_TEMPLATE_REQUIRED` (error): `template` is empty or not a string. It must hold the literal template text.
- `RENDER_TEMPLATE_IS_LIBRARY_NAME` (warning): `template` equals the `moduleName` of one of the service's `library.templates` (with or without a `.ejs` suffix). RenderDataAction does not look the name up and does not evaluate EJS, so the action would return that bare word. Paste the template text itself, with `${key}` placeholders, into `template`.

## Errors

- `inputData` evaluating to something other than an object: substitution falls back to the empty string for every `${...}` placeholder.
- The action does not throw on missing keys; it silently substitutes the empty string. Guard with a downstream `ValidationAction` if a placeholder *must* resolve.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`RenderPdfAction`](./render-pdf-action.md): full template-driven PDF rendering with `PdfTemplate`.
- [`DataToFileAction`](./data-to-file-action.md): serialize data to a file format (CSV/JSON/TXT).
- [`AddToContextAction`](./add-to-context-action.md): build richer strings with arbitrary MScript when `${key}` substitution is not enough.
- [`SendMailAction`](./send-mail-action.md), [`SendSmsAction`](./send-sms-action.md), [`SendPushNotificationAction`](./send-push-notification-action.md), [`SendWhatsAppAction`](./send-whatsapp-action.md): common downstream consumers.
