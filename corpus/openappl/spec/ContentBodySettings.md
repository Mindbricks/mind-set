# ContentBodySettings

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentBodySettings in Part 1](../ontology/ContentBodySettings.md)

The rich-content body of a content model (or of its child items via childSettings.bodyFormat). Synthesizes a 'body' property on the content DataObject: Text for richText/markdown, Object (an ordered JSON array of typed blocks) for blocks. The blocks format is the portable choice — the frontend renders each block type itself, so the same content serves web, mobile, email, and PDF rendering.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `format` | `ContentBodyFormat` | no | `"richText"` | `richText`, `markdown`, `blocks` |  | The body format. 'richText' = HTML (default — WYSIWYG editing), sanitized server-side on every write (create, update, bulk, restoreVersion, CRUD actions) and again on public delivery with a fixed allowlist (richTextAllowlist can extend it for the record body): kept are h1-h6, p, br, hr, ul, ol, li, blockquote, pre, code, b, strong, i, em, u, s, strike, sub, sup, span, mark, small, a (href, title, target, rel; http, https, mailto or relative URLs; target _blank gets rel noopener noreferrer), img (src, alt, title, width, height, plus the editor's display options data-size = 25, 50, 75 or 100, data-align = left, center or right, and loading = lazy or eager; http, https or relative src, no data: images), figure (data-align = left, center or right), figcaption and table, thead, tbody, tfoot, tr, th, td (colspan, rowspan), caption; a data-size, data-align or loading value outside its set removes that attribute and keeps the element; removed are script and style elements with their content, every other element (its text kept), style, class, on* and every other data-* attribute, and javascript:, vbscript:, data: and other URL schemes; 'markdown' = markdown source (developer-facing content: docs, release notes); 'blocks' = an ordered JSON array of typed content blocks (paragraph, heading, image, quote, embed, cta, …) — renderer-agnostic and the recommended format for marketing/landing content. |
| `localized` | `Boolean` | no | `true` |  |  | When true AND localizationSettings is enabled, the body differs per locale variant. Default: true (a body is almost always language-specific). |
| `allowedBlocks` | `String`[] | no |  |  |  | For the blocks format only: the block type names editors may offer (e.g. ['paragraph', 'heading', 'image', 'quote', 'cta']). Empty/absent = any block type. This is editor configuration for the editor-side block-type registry (docs/ADR-content-platform-pattern-family.md sections 8 and 9); generated services store renderer-agnostic JSON and do not enforce this list or define a block discriminator. A nonempty list with richText/markdown is rejected at design time as CONTENT_BLOCKS_FORMAT_MISMATCH. |
| `richTextAllowlist` | [`ContentRichTextAllowRule`](./ContentRichTextAllowRule.md)[] | no |  |  |  | For the richText format only: rules that EXTEND the fixed sanitizer allowlist for the record body (child item bodies and richText fields keep the fixed set). Each rule names one tag - a tag of the fixed set (to admit more attributes or classes on it) or one of the extra safe tags div, section, article, aside, header, footer, nav, details, summary, abbr, cite, q, dl, dt, dd, kbd, samp, var, del, ins, time, address, colgroup, col - with the attributes and exact class names it may keep. Attribute names are data-[a-z0-9-]+ or title, lang, dir, datetime, cite, open, start, reversed, scope, abbr, span, colspan, rowspan, width, height, alt; never on*, style, srcset, formaction, xlink:href, is, slot or class (classes go in the rule's classes list), and never an attribute the fixed set already governs for that tag. The tags script, style, iframe, object, embed, svg, math, form, input, textarea, base, meta, link and template can never be allowed. Validation refuses a rule outside these limits; the generated sanitizer applies the same limits again. Empty/absent = exactly the fixed allowlist. Supported for nodejs, python, dotnet and rust services; other languages refuse the setting until their sanitizer supports it. |

## Constraints

Property rules:

- `format` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `richTextAllowlist` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
