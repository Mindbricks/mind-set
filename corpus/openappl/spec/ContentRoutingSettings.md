# ContentRoutingSettings

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentRoutingSettings in Part 1](../ontology/ContentRoutingSettings.md)

Public delivery routing generates a slug on first publish from slugSource; drafts are addressed by id in editorial APIs. Collection delivery uses /content/{kebab-name}/{slug}; authenticated editorial preview also accepts the record id. Generated editorial writes exclude slug and publish-managed fields. Singleton delivery uses the model base route. basePath is a frontend page-path hint, not the service API prefix; singletons without an explicit basePath are omitted from the public sitemap. Optional seo metadata is attached to the delivery payload.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `basePath` | `String` | no |  |  |  | The public frontend path this content lives under, surfaced in delivery payloads and the sitemap feed (e.g. '/blog', '/help', '/legal/privacy' for a singleton). Defaults to '/{kebab-case model name}'. Informational to the consuming frontend — the service delivery API prefix stays /content/{name}/. |
| `slugSource` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Name of the declared field the slug is generated from (kebab-cased, uniquified). Must be a text-typed declared field. Defaults to 'title' — which must then exist as a field. Ignored by singleton models (their route needs no slug). |
| `seoEnabled` | `Boolean` | no | `true` |  |  | When true (default), a 'seo' object property (title, description, canonicalUrl, ogImage, structuredData) is synthesized and served with each routed record. It does not control the sitemap: the delivery sitemap feed lists every routed, publicRead model's published records (a singleton only with an explicit basePath), whatever this flag says. |

## Constraints

Property rules:

- `slugSource` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
