# PaperMargin

**Level:** `subsection` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [PaperMargin in Part 1](../ontology/PaperMargin.md)

Page margins for PDF rendering, in millimeters. When supplied on a PdfTemplate, applies to every render of that template; per-call overrides on RenderPdfAction take precedence.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `top` | `Integer` | no | `20` |  |  | Top margin in millimeters. |
| `right` | `Integer` | no | `15` |  |  | Right margin in millimeters. |
| `bottom` | `Integer` | no | `20` |  |  | Bottom margin in millimeters. |
| `left` | `Integer` | no | `15` |  |  | Left margin in millimeters. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
