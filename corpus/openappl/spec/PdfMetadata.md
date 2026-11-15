# PdfMetadata

**Level:** `subsection` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [PdfMetadata in Part 1](../ontology/PdfMetadata.md)

Document-level metadata embedded in the generated PDF (visible in PDF readers' document-properties pane and used by some catalog/search systems).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `title` | `String` | no |  |  |  | PDF document title. Shown in PDF readers and as the browser tab title when viewed inline. |
| `author` | `String` | no |  |  |  | Author or organization name embedded in the PDF metadata. |
| `subject` | `String` | no |  |  |  | Short description of the document's subject. |
| `keywords` | `String` | no |  |  |  | Comma-separated keywords for indexing or search. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
