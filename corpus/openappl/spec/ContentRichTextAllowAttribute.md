# ContentRichTextAllowAttribute

**Level:** `subsection` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentRichTextAllowAttribute in Part 1](../ontology/ContentRichTextAllowAttribute.md)

**Name:** an instance is named by `name`.

One attribute a richTextAllowlist rule admits on its tag.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The attribute name: data-[a-z0-9-]+ (lowercase) or one of title, lang, dir, datetime, cite, open, start, reversed, scope, abbr, span, colspan, rowspan, width, height, alt. |
| `pattern` | `String` | no |  |  |  | Optional value pattern, a portable regular-expression subset: anchored ^...$, at most 128 characters, either one group of literal alternatives such as ^(note\|tip\|warning)$ or literals and character classes with ?, {n} or {n,m} (m at most 256) and at most one variable-length quantifier, such as ^[0-9]{1,4}$ or ^#[0-9a-f]{6}$. No *, +, ., nested groups or backreferences. Absent = any value within maxLength. |
| `maxLength` | `Integer` | no |  |  |  | Longest value kept, 1 to 512. Default: 128. Checked before the pattern. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
