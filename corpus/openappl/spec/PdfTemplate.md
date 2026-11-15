# PdfTemplate

**Level:** `section` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [PdfTemplate in Part 1](../ontology/PdfTemplate.md)

**Name:** an instance is named by `name`.

Defines a PDF rendering template used by `RenderPdfAction` to produce styled PDFs (e.g., invoices, receipts, statements). The body is an EJS template that produces HTML, which is rendered to PDF using the service's PDF rendering layer. Page setup (paper size, orientation, margins), optional header/footer EJS templates, and document metadata are configured per template so every render of the same template is visually consistent. Per-call overrides are supported on RenderPdfAction.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The unique name of the PDF template. Used to reference the template from `RenderPdfAction`. |
| `description` | `Text` | no |  |  |  | A brief description of the template's purpose (e.g., 'Customer invoice with VAT breakdown'). |
| `parser` | `String` | no | `"ejs"` |  |  | The template rendering engine. Currently only 'ejs' is supported. |
| `bodyTemplate` | `Text` | yes |  |  |  | The main EJS template producing the body HTML of the PDF. Has access to the input data passed by RenderPdfAction. |
| `headerTemplate` | `Text` | no |  |  |  | Optional EJS template producing repeating page-header HTML. Supports the same template variables as the body, plus two renderer placeholders: `pageNumber` and `totalPages` (e.g. `Page <%= pageNumber %> / <%= totalPages %>`). They are not numbers at EJS time: the renderer turns each one into the Chromium page-number element (`<span class="pageNumber"></span>` / `<span class="totalPages"></span>`) that is filled in per page, so use them only for output, never in arithmetic or conditions. They take precedence over an inputData key of the same name. The header is rendered in its own document without the body's stylesheet: use inline styles and set an explicit font-size (the renderer's default is very small). |
| `footerTemplate` | `Text` | no |  |  |  | Optional EJS template producing repeating page-footer HTML. Same data access as headerTemplate, including the `pageNumber` and `totalPages` placeholders (e.g. `Page <%= pageNumber %> / <%= totalPages %>`), which become Chromium page-number elements filled in per page; like the header it is rendered without the body's stylesheet, so use inline styles and an explicit font-size. |
| `paperSize` | `PaperSize` | no | `"A4"` | `A4`, `A3`, `A5`, `Letter`, `Legal`, `Tabloid` |  | Default paper size for this template. Per-call overrides supported on RenderPdfAction. |
| `orientation` | `Orientation` | no | `"portrait"` | `portrait`, `landscape` |  | Default page orientation for this template. Per-call overrides supported on RenderPdfAction. |
| `margin` | [`PaperMargin`](./PaperMargin.md) | no |  |  |  | Default page margins (millimeters) for this template. |
| `metadata` | [`PdfMetadata`](./PdfMetadata.md) | no |  |  |  | PDF document metadata embedded in the output file. |

## Constraints

Property rules:

- `name`, `bodyTemplate` must be present. (`REQUIRED_FIELD_MISSING`)
- `paperSize`, `orientation` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
