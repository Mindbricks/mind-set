# MediaProcessingSpec

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [MediaProcessingSpec in Part 1](../ontology/MediaProcessingSpec.md)

Type-specific spec for `media-processing` ComputeJobs — image resize/thumbnails, PDF→image, OCR preprocessing, audio waveform, transcoding orchestration. toolOrchestrated: the work is done by an external binary (FFmpeg, Tesseract, PyMuPDF); the compiler generates intake, the storage adapter, variant/thumbnail rules, the transcode/OCR profile, and artifact metadata — not the codecs. Presets: ThumbnailJob (`op:thumbnail`), TranscodingJob (`op:transcode`), PdfProcessingJob (`op:pdf-render/ocr`).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `op` | `String` | no |  |  |  | The media operation: `thumbnail\|resize\|transcode\|pdf-render\|ocr\|waveform`. Kept as String in v1. |
| `tool` | `String` | no |  |  |  | The external tool/binary or library used: `ffmpeg\|tesseract\|pymupdf\|image`. Kept as String in v1. |
| `variants` | `String`[] | no |  |  |  | List of output variants to produce (e.g. thumbnail sizes). Kept as String entries in v1. |
| `transcodeProfile` | `String` | no |  |  |  | Optional transcode profile (codec/bitrate/container) for `transcode` ops (String in v1). |
| `ocrProfile` | `String` | no |  |  |  | Optional OCR profile (language/engine settings) for `ocr` ops (String in v1). |
| `artifact` | `String` | no |  |  |  | Artifact metadata/format for the produced media outputs (String in v1). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
