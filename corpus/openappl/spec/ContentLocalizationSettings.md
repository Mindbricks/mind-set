# ContentLocalizationSettings

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentLocalizationSettings in Part 1](../ontology/ContentLocalizationSettings.md)

The localization capability of a content model. When enabled, records exist as one row PER LOCALE VARIANT: every row carries a synthesized 'locale' plus a shared 'localeGroupId' that groups the variants of one logical content. Fields marked 'localized' (and the body when bodySettings.localized) differ per variant; unlocalized fields are mirrored from the default-locale row by the editorial runtime. The delivery API resolves ?locale= per request and falls back to the default locale when a variant is missing (fallbackToDefault).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Master toggle for localization. Default: false. |
| `locales` | `String`[] | no |  |  |  | BCP-47 locale codes this content is authored in (e.g. ['en', 'tr', 'de']). At least one required when enabled. |
| `defaultLocale` | `String` | no |  |  |  | The authoritative locale unlocalized fields mirror from and delivery falls back to. Must be one of 'locales'. Defaults to the first entry. |
| `fallbackToDefault` | `Boolean` | no | `true` |  |  | When true (default), a delivery request for a locale with no published variant serves the default-locale variant instead of 404. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
