---
title: RenderPdfAction
---

# RenderPdfAction

`RenderPdfAction` renders a PDF either from a declared `PdfTemplate` plus input data, or from pre-rendered HTML. The result, `{ fileName, content: Buffer, contentType: "application/pdf" }`, is stored on the workflow context under `contextPropertyName` and is typically attached to a `SendMailAction` or returned as a download via `sendToClient: true`.

The PDF rendering layer is provisioned automatically by the hosting platform whenever any service in the project declares a `PdfTemplate` or `RenderPdfAction`. There is no provider configuration to author.

## When to use it

- Generate an invoice / receipt PDF and email it as an attachment.
- Produce a printable report and let the client download it directly.
- Render a contract PDF that gets stored, attached, or signed downstream.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `pdfTemplate` | `String` |   | Name of a `PdfTemplate` defined in this service's `ServiceLibrary`. The template's `bodyTemplate` is rendered with `inputData` to produce HTML before PDF conversion. Required unless `html` is supplied. The authentication module has no `ServiceLibrary`, so a `RenderPdfAction` there uses `html` only. |
| `inputData` | `MScript` |   | Expression evaluating to the data passed into the body template. Should be set when `pdfTemplate` is used and `html` is not (validation warns otherwise; the template is rendered with an empty object). Typically constructed from context, e.g., `this.invoice`. |
| `html` | `MScript` |   | Expression evaluating to a fully-rendered HTML string. Use this when an upstream action already produced the HTML (typically a `RenderDataAction` whose output is reused as both an email body and the PDF source). When `html` is supplied, `pdfTemplate`/`inputData` are not used for body rendering, but `pdfTemplate` may still be referenced to inherit page setup, header, and footer. |
| `paperSize` | `PaperSize` |   | Per-call override of the template's paper size (`A4`, `A3`, `A5`, `Letter`, `Legal`, `Tabloid`, ...). When omitted, the template's default applies. |
| `orientation` | `Orientation` |   | Per-call override of the template's page orientation (`portrait` / `landscape`). When omitted, the template's default applies. |
| `margin` | `PaperMargin` |   | Per-call override of the template's page margins. When omitted, the template's default applies. |
| `fileName` | `MScript` |   | Expression evaluating to the file name used both when the PDF is attached to an email and when it is sent to the client. Defaults to the template name with a `.pdf` extension. Example: `` `Invoice-${this.invoice.number}.pdf` ``. |
| `sendToClient` | `Boolean` |   | When `true`, the generated PDF is returned to the client as a downloadable attachment in the API response. When `false` (default), the PDF only lives on context for use by later actions. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

There are two input modes:

- **Template + data**: set `pdfTemplate` + `inputData`. The template's body is rendered with the data; the resulting HTML is converted to PDF inheriting the template's page setup, header, and footer.
- **Pre-rendered HTML**: set `html`. Useful when the HTML was already produced by a `RenderDataAction` (e.g., for an email body) and you want the same HTML inside the PDF. `pdfTemplate` is still optional here, used only for page-setup / header / footer inheritance.

The template's header and footer templates can print `pageNumber` and `totalPages`, which resolve to the current page number and the page count of the rendered PDF.

Page-setup overrides (`paperSize`, `orientation`, `margin`) are only applied when the designer explicitly supplied them: unset overrides fall through to the template's defaults at runtime, never null them out.

When `sendToClient: true`, the action sets `this._fileDownload = { filename, mimeType, buffer }` on the context; the service's REST layer picks this up after the workflow completes and writes the in-memory buffer as the response body (`Content-Type: application/pdf`; a `DataToFileAction` signal carries a `filePath` instead and is served from that file) with the appropriate `Content-Disposition: attachment` header. `filename` is an MScript expression evaluated at runtime, so it can carry request- or DB-derived text; the response header is built following RFC 6266: the name is reduced to a basename, both the ASCII and the `filename*=UTF-8''` halves are emitted, and building it cannot throw. An unpaired surrogate or a non-ASCII name yields a served file, not a 500.

In all cases the action's own return value is the result object. Typically you also bind `contextPropertyName` so later actions (most commonly [`SendMailAction`](./send-mail-action.md)) can attach the PDF.

## Examples

Render an invoice and email it as an attachment. The two actions live in different slots on `BusinessApiActionStore`: `renderPdfActions[]` and `sendMailActions[]`:

```json
"renderPdfActions": [
  {
    "name": "renderInvoice",
    "writeToResponse": false,
    "contextPropertyName": "invoicePdf",
    "pdfTemplate": "InvoiceTemplate",
    "inputData": { "js": "this.invoice" },
    "fileName": { "js": "`Invoice-${this.invoice.number}.pdf`" }
  }
],
"sendMailActions": [
  {
    "name": "emailInvoice",
    "writeToResponse": false,
    "provider": "sendgrid",
    "to": { "js": "this.invoice.customer.email" },
    "subject": { "js": "`Invoice ${this.invoice.number}`" },
    "body": { "js": "this.emailBody" },
    "attachments": { "js": "[this.invoicePdf]" }
  }
]
```

Reuse a `RenderDataAction`-produced string for both the email and the PDF, and stream the PDF directly to the client. Again, two slots:

```json
"renderDataActions": [
  {
    "name": "buildBody",
    "writeToResponse": false,
    "contextPropertyName": "invoiceHtml",
    "inputData": { "js": "({ code: this.invoice.number, total: this.invoice.total })" },
    "template": "<h1>Invoice ${code}</h1><p>Total: ${total}</p>"
  }
],
"renderPdfActions": [
  {
    "name": "renderInvoicePdf",
    "writeToResponse": false,
    "pdfTemplate": "InvoiceTemplate",
    "html": { "js": "this.invoiceHtml" },
    "sendToClient": true
  }
]
```

## Errors

- Neither `pdfTemplate` nor `html` is set: project validation error naming both fields.
- `pdfTemplate` references a template not declared in the owning service's `ServiceLibrary` (in the authentication module: any template): project validation error.
- `pdfTemplate` without `inputData` or `html`: project validation warning; the template is rendered with an empty object, so a template variable the data does not carry fails at render time.
- PDF renderer unreachable: runtime failure; surfaced via `onActionError`.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`PdfTemplate`](../../spec/PdfTemplate.md): template definition that lives in `ServiceLibrary`.
- [`RenderDataAction`](./render-data-action.md): produce the HTML separately, then feed it in via `html`.
- [`SendMailAction`](./send-mail-action.md): typical downstream consumer.
