# ContentBodySettings

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentBodySettings in Part 2](../spec/ContentBodySettings.md)

The rich-content body of a content model (or of its child items via childSettings.bodyFormat). Synthesizes a 'body' property on the content DataObject: Text for richText/markdown, Object (an ordered JSON array of typed blocks) for blocks. The blocks format is the portable choice — the frontend renders each block type itself, so the same content serves web, mobile, email, and PDF rendering.

## Contained in

- [ContentModel](./ContentModel.md) as `bodySettings`

Blueprint paths:

- `services.contentModels.bodySettings`

## Contains

- `richTextAllowlist`: [ContentRichTextAllowRule](./ContentRichTextAllowRule.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
