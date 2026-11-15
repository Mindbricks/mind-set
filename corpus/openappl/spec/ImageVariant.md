# ImageVariant

**Level:** `subsection` · **Family:** [RemoteBucket](../ontology/families.md#remotebucket) (domain `Service`)

**Ontology:** [ImageVariant in Part 1](../ontology/ImageVariant.md)

**Name:** an instance is named by `name`.

One resized copy of every image a bucket stores (see RemoteBucketBasics.imageVariants). The variant is produced with `sharp`: auto-orient, resize to `width` (and `height` when set) under `fit`, encode as `format` at `quality`, metadata stripped. The original is never modified.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Variant name, unique within the bucket (case-insensitive). It is the key of the `variants` record on the twin row, the `?variant=` value of the download route and the suffix of the variant object key (`<key>__<name>.<format>`). Must be an identifier: a letter, then letters, digits or underscores, at most 40 characters. |
| `width` | `Integer` | yes |  |  |  | Target width in pixels, an integer from 1 to 10000. With `fit` inside (the default) and no height, the image is scaled to this width keeping its aspect ratio. |
| `height` | `Integer` | no |  |  |  | Optional target height in pixels (1 to 10000). Leave null to derive it from the aspect ratio. cover, contain and fill only differ from inside when a height is set. |
| `fit` | `ImageVariantFit` | no | `"inside"` | `inside`, `cover`, `contain`, `fill`, `outside` |  | How the image is fitted to width x height (the sharp `fit` option). Default inside. |
| `format` | `ImageVariantFormat` | no | `"webp"` | `webp`, `jpeg`, `png`, `avif` |  | Output format of the variant object, which also gives its key extension and Content-Type. Default webp. |
| `quality` | `Integer` | no | `80` |  |  | Encoder quality from 1 to 100 for webp, jpeg and avif. Default 80. png output is lossless and ignores it. |
| `withoutEnlargement` | `Boolean` | no | `true` |  |  | When true (the default), an image smaller than the target is never upscaled: the variant keeps the original dimensions (re-encoded in `format`). |

## Constraints

Property rules:

- `name`, `width` must be present. (`REQUIRED_FIELD_MISSING`)
- `fit`, `format` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
