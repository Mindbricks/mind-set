# PdfTemplate

**Level:** `section` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [PdfTemplate in Part 2](../spec/PdfTemplate.md)

Defines a PDF rendering template used by `RenderPdfAction` to produce styled PDFs (e.g., invoices, receipts, statements). The body is an EJS template that produces HTML, which is rendered to PDF using the service's PDF rendering layer. Page setup (paper size, orientation, margins), optional header/footer EJS templates, and document metadata are configured per template so every render of the same template is visually consistent. Per-call overrides are supported on RenderPdfAction.

## Contained in

- [ServiceLibrary](./ServiceLibrary.md) as `pdfTemplates` (a list)

Blueprint paths:

- `services.library.pdfTemplates`

## Contains

- `margin`: [PaperMargin](./PaperMargin.md)
- `metadata`: [PdfMetadata](./PdfMetadata.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
