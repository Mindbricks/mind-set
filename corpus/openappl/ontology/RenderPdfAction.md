# RenderPdfAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [RenderPdfAction in Part 2](../spec/RenderPdfAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Renders a PDF from a `PdfTemplate` + input data, or from pre-rendered HTML. The result (an object `{ fileName, content: Buffer, contentType: 'application/pdf' }`) is stored in the action context under `contextPropertyName` and can be referenced by subsequent actions — most commonly attached to a `SendMailAction` or returned as a downloadable response via `sendToClient`. Page setup defaults come from the PdfTemplate; per-call overrides win when supplied. The PDF rendering layer (Gotenberg) is provisioned automatically by the deployer whenever any service declares a PdfTemplate or RenderPdfAction — no provider configuration is exposed at design time.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `renderPdfActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.renderPdfActions`
- `services.businessLogic.actions.renderPdfActions`

## Contains

- `margin`: [PaperMargin](./PaperMargin.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
