# ContentLocalizationSettings

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentLocalizationSettings in Part 2](../spec/ContentLocalizationSettings.md)

The localization capability of a content model. When enabled, records exist as one row PER LOCALE VARIANT: every row carries a synthesized 'locale' plus a shared 'localeGroupId' that groups the variants of one logical content. Fields marked 'localized' (and the body when bodySettings.localized) differ per variant; unlocalized fields are mirrored from the default-locale row by the editorial runtime. The delivery API resolves ?locale= per request and falls back to the default locale when a variant is missing (fallbackToDefault).

## Contained in

- [ContentModel](./ContentModel.md) as `localizationSettings`

Blueprint paths:

- `services.contentModels.localizationSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
