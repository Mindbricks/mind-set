# AgentImageSettings

**Level:** `section` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentImageSettings in Part 1](../ontology/AgentImageSettings.md)

Image generation parameters. Only applicable when modality is 'image'. These settings are passed to the provider's image generation API (e.g., DALL-E, Fal AI).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `size` | `String` | no | `"1024x1024"` |  |  | Output image dimensions. Common values: '1024x1024' (square), '1792x1024' (landscape), '1024x1792' (portrait). Available sizes depend on the provider and model. |
| `quality` | `AgentImageQuality` | no |  | `standard`, `hd` |  | Image quality level: 'standard' for faster/cheaper generation, 'hd' for higher detail. Not all providers support quality control. |
| `style` | `AgentImageStyle` | no |  | `natural`, `vivid` |  | Artistic style: 'natural' for realistic output, 'vivid' for hyper-real/dramatic output. Provider-specific. |
| `count` | `Integer` | no | `1` |  | min 1 | Number of images to generate per request. Default: 1. Some providers support batch generation. |

## Constraints

Property rules:

- `quality`, `style` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `count` must be at least 1. (`VALUE_OUT_OF_RANGE`)
