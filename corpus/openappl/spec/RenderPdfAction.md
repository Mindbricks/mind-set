# RenderPdfAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [RenderPdfAction in Part 1](../ontology/RenderPdfAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Renders a PDF from a `PdfTemplate` + input data, or from pre-rendered HTML. The result (an object `{ fileName, content: Buffer, contentType: 'application/pdf' }`) is stored in the action context under `contextPropertyName` and can be referenced by subsequent actions — most commonly attached to a `SendMailAction` or returned as a downloadable response via `sendToClient`. Page setup defaults come from the PdfTemplate; per-call overrides win when supplied. The PDF rendering layer (Gotenberg) is provisioned automatically by the deployer whenever any service declares a PdfTemplate or RenderPdfAction — no provider configuration is exposed at design time.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `pdfTemplate` | `String` | no |  |  |  | Name of a PdfTemplate defined in this service's ServiceLibrary. Required unless `html` is supplied: a RenderPdfAction with neither `pdfTemplate` nor `html` is a validation error, and so is a `pdfTemplate` that names no PdfTemplate in the owning service's library. The authentication module has no ServiceLibrary, so a RenderPdfAction there must use `html` and leave `pdfTemplate` empty. When set, the template's bodyTemplate is rendered with `inputData` to produce the HTML before PDF conversion. |
| `inputData` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript expression evaluating to the data passed into the EJS template. Should be set when `pdfTemplate` is used and `html` is not (validation warns otherwise; the template is then rendered with an empty object). Typically constructed from context (e.g., `{ "js": "this.invoice" }`). |
| `html` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript expression evaluating to a fully-rendered HTML string. Use this when the HTML was produced by a prior action (e.g., a `RenderDataAction` whose output you also use as an email body). When `html` is provided, `pdfTemplate`/`inputData` are not used for body rendering — but `pdfTemplate` may still be referenced to inherit page setup, header, and footer. |
| `paperSize` | `PaperSize` | no |  | `A4`, `A3`, `A5`, `Letter`, `Legal`, `Tabloid` |  | Optional per-call override of the template's paper size. |
| `orientation` | `Orientation` | no |  | `portrait`, `landscape` |  | Optional per-call override of the template's orientation. |
| `margin` | [`PaperMargin`](./PaperMargin.md) | no |  |  |  | Optional per-call override of the template's margins. |
| `fileName` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression evaluating to the file name used both when the PDF is attached to an email and when it is sent to the client (e.g., `` `Invoice-${this.invoice.number}.pdf` ``). Defaults to the template name with a `.pdf` extension. |
| `sendToClient` | `Boolean` | no | `false` |  |  | If true, the generated PDF is returned to the client as a downloadable attachment in the API response. If false (default), the PDF is only stored in context for use by later actions. |

## Constraints

Property rules:

- `paperSize`, `orientation` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `PDF_TEMPLATE_NOT_FOUND` | error |  |
| `RENDER_PDF_INPUT_DATA_MISSING` | warning | RenderPdfAction uses PdfTemplate "…" without `inputData` or `html`: the template body is rendered with an empty object, so any variable it references is undefined at render time. |
| `RENDER_PDF_SOURCE_MISSING` | error | RenderPdfAction needs a body source: set `pdfTemplate` (a PdfTemplate declared in this service's ServiceLibrary, with `inputData`) or `html` (an MScript returning the rendered HTML). |

## Example

Use to render a PDF from a PdfTemplate + input data (or pre-rendered HTML); the result object is stored in context for attaching to a SendMailAction or returned directly when sendToClient is true.

```json
{
  "name": "renderInvoicePdf",
  "description": "Render the invoice PDF in A4 portrait for emailing to the customer.",
  "pdfTemplate": "invoicePdf",
  "inputData": { "js": "this.invoice" },
  "paperSize": "A4",
  "orientation": "portrait",
  "margin": {
    "top": 20,
    "right": 15,
    "bottom": 20,
    "left": 15
  },
  "fileName": { "js": "`Invoice-${this.invoice.number}.pdf`" },
  "sendToClient": false,
  "contextPropertyName": "invoicePdf"
}
```
