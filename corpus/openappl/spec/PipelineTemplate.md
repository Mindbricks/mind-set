# PipelineTemplate

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [PipelineTemplate in Part 1](../ontology/PipelineTemplate.md)

**Name:** an instance is named by `filename`.

The asset to store a template for generating custom pipeline files. Used in project level and applied to all microservices.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `filename` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The name of the pipeline file that will be generated like .gitlab-ci.yml |
| `template` | `Text` | yes |  |  |  | The ejs source code of the template that renders the pipeline file. |

## Constraints

Property rules:

- `filename`, `template` must be present. (`REQUIRED_FIELD_MISSING`)
- `filename` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
