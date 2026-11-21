---
title: CreateObjectAction
---

# CreateObjectAction

Builds a plain object from key-value pairs and stores it on the workflow context. **This action does not write to the database.** For a database insert, use [`CreateCrudAction`](./create-crud-action.md).

Use `CreateObjectAction` when a downstream action expects a structured payload: e.g. the body for an [`ApiCallAction`](./api-call-action.md), the template variables for a [`SendMailAction`](./send-mail-action.md), or a response-shaping wrapper.

## When to use it

- Compose a single named object that will be passed to a later action.
- Layer a fixed shape over a dynamic `mergeObject` (defaults + overrides).
- Replace a tangle of [`AddToContextAction`](./add-to-context-action.md) entries when the values logically belong to one record.
- `AddToContextAction` is the right choice when you need several **independent** context slots; `CreateObjectAction` is the right choice when the values belong to **one** object.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md). The constructed object lands on `this.<contextPropertyName>`, so that field is effectively required.

| Property | Type | Req | Description |
|---|---|---|---|
| `payload` | `ObjectData[]` | yes | The base key-value pairs. Each entry's `value` is evaluated as MScript. |
| `mergeObject` | `MScript` | no | Expression returning an object; its keys are shallow-merged onto the base object after `payload` is built. |

`ObjectData` fields:

| Property | Type | Req | Description |
|---|---|---|---|
| `key` | `String` | yes | Property name on the constructed object. |
| `value` | `MScript` | yes | Expression yielding the value. May reference `this`, session, request parameters, or prior action results. |

## Behaviour

The action builds a plain object whose entries are the evaluated MScript expressions. When `mergeObject` is set, its keys are then shallow-merged onto that object: they override keys produced by `payload`. The result is bound to `this.<contextPropertyName>`.

## Example

Compose template variables for an email:

```json
{
  "name": "buildWelcomeVars",
  "writeToResponse": false,
  "contextPropertyName": "welcomeVars",
  "payload": [
    { "key": "firstName",    "value": { "js": "this.user.firstName" } },
    { "key": "verifyUrl",    "value": { "js": "`${process.env.APP_BASE_URL}/verify?token=${this.shareToken}`" } },
    { "key": "supportEmail", "value": { "js": "process.env.SUPPORT_EMAIL" } }
  ],
  "mergeObject": { "js": "this.locale === 'tr' ? { greeting: 'Merhaba' } : { greeting: 'Hello' }" }
}
```

The downstream `SendMailAction` references `this.welcomeVars` as its template variables.

## See also

- [`CreateCrudAction`](./create-crud-action.md): writes to the database
- [`AddToContextAction`](./add-to-context-action.md): independent context slots
- [`AddToResponseAction`](./add-to-response-action.md): shape the response
- [`ObjectData`](../../spec/ObjectData.md), [MScript overview](../mscript/overview.md)
