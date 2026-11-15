# MediaProcessingSpec

**Level:** `subsection` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [MediaProcessingSpec in Part 2](../spec/MediaProcessingSpec.md)

Type-specific spec for `media-processing` ComputeJobs — image resize/thumbnails, PDF→image, OCR preprocessing, audio waveform, transcoding orchestration. toolOrchestrated: the work is done by an external binary (FFmpeg, Tesseract, PyMuPDF); the compiler generates intake, the storage adapter, variant/thumbnail rules, the transcode/OCR profile, and artifact metadata — not the codecs. Presets: ThumbnailJob (`op:thumbnail`), TranscodingJob (`op:transcode`), PdfProcessingJob (`op:pdf-render/ocr`).

## Contained in

- [ComputeJobSpec](./ComputeJobSpec.md) as `mediaProcessing`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
