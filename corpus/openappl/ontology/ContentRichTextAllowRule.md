# ContentRichTextAllowRule

**Level:** `subsection` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentRichTextAllowRule in Part 2](../spec/ContentRichTextAllowRule.md)

One rule of bodySettings.richTextAllowlist: a tag the richText body may keep, with the extra attributes and the exact class names it may carry. A value outside an attribute's pattern or length cap removes that attribute and keeps the element; a class token not in classes is removed.

## Contained in

- [ContentBodySettings](./ContentBodySettings.md) as `richTextAllowlist` (a list)

## Contains

- `attributes`: [ContentRichTextAllowAttribute](./ContentRichTextAllowAttribute.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
