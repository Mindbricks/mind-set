# VideoCustomAnalysis

**Level:** `subsection` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoCustomAnalysis in Part 1](../ontology/VideoCustomAnalysis.md)

**Name:** an instance is named by `name`.

One domain-specific LLM analysis pass over the room transcript. The prompt receives the full transcript and must describe the desired extraction; the result is stored as a {name}MeetingInsight row with kind = this analysis's name.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique analysis identifier — becomes the insight row's kind. Examples: 'salesObjections', 'homeworkAssigned', 'complianceFlags'. |
| `prompt` | `Text` | yes |  |  |  | The analysis instruction given to the LLM together with the transcript. Describe WHAT to extract and the desired output shape. Example: 'List every customer objection raised and how the seller responded, as an array of {objection, response}.' |

## Constraints

Property rules:

- `name`, `prompt` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
