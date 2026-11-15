# mind-set corpus

The documents the mind-set skills read. `mind-set install` copies this folder to
`~/.mind-set/<version>/` and links it as `~/.mind-set/current`; every skill names its files
by their absolute path in that copy.

```
procedures/    how to design and write a blueprint, step by step
  design/      the design document pipeline (pipeline.json), the writer guides, the canon
openappl/      the OpenAPPL specification
  ontology/    Part 1: how the patterns fit together, one page per pattern
  spec/        Part 2: one reference page per pattern, value formats, the schema page
  guides/      Part 2 guides: data modeling, business APIs, MScript, workflows, ...
  compiler/    Part 3: what a compiler derives from a blueprint (routes, events, derived surface)
guides/        contract.md, review.md, validate.md
openappl.json  the OpenAPPL schema this corpus was built for
examples/      example blueprints that validate against openappl.json
```

The OpenAPPL version of the corpus is `__patternsVersion` in `openappl.json`; the mind-set
package version is the folder name. Do not edit the files here: a new `mind-set update`
replaces them.

Design documents and the blueprint live in your working folder (`design/<docName>.md`,
`blueprint.json`), never in the corpus.
