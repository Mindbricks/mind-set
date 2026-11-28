# The schema: openappl.json

`openappl.json` is the machine-readable definition of the OpenAPPL language: every
pattern, its properties, their types, defaults and allowed values. The ontology and
specification pages of this corpus are generated from it, so the file and the pages
always describe the same language version.

**Version of this corpus:** `1.104.0` (the corpus copy: [openappl.json](../../openappl.json)).

- A blueprint is a JSON document whose shape follows the patterns defined in
  `openappl.json`. `mindset validate` and compilers read the file to know which
  properties a pattern has and which values they accept.
- The version follows semantic versioning: a minor release adds patterns or
  properties, a major release may remove or rename them.
