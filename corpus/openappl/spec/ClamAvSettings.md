# ClamAvSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ClamAvSettings in Part 1](../ontology/ClamAvSettings.md)

**Activation:** the pattern is switched on by `useClamAv`.

Settings for the ClamAV scanner that checks files uploaded through DbBucket / NativeBucket / RemoteBucket when bucket.virusScan is true. When useClamAv is false (default) the runtime scanner uses the platform ClamAV REST service (POST `/api/v1/scan` on the default ClamAV host `clamav.mindbricks.com`, one file per request in the multipart field FILES, at most 100 MB per file). Use this block when you run your own ClamAV (a REST endpoint with the same contract, or a clamd daemon spoken to with INSTREAM), want to override the timeout, or want a default scan mode for buckets that don't set virusScanMode. The platform endpoint is plain HTTP as published: file bytes travel in clear text to that host.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useClamAv` | `Boolean` | yes |  |  |  | When true, the generator writes this connection into the env files of every service with a virus-scanning bucket. It emits CLAMAV_PROTOCOL, then CLAMAV_BASE_URL (rest) or CLAMAV_HOST and CLAMAV_PORT (clamd), and CLAMAV_TIMEOUT_MS, on all four slots. A key already set is never overwritten, and a blueprint custom variable or per-env overlay row for CLAMAV_PROTOCOL, CLAMAV_HOST or CLAMAV_BASE_URL owns the transport in that slot: no protocol, url, host or port line is added beside it (a custom CLAMAV_HOST alone means clamd on that host). defaultMode is not emitted as an env var; it is resolved per bucket at design time. When false, nothing is emitted and the scanner uses REST against the platform ClamAV host. This flag does NOT enable scanning on buckets - each bucket must opt in via bucketBasics.virusScan. |
| `configuration` | [`ClamAvSettingsConfig`](./ClamAvSettingsConfig.md) | no |  |  |  | Connection details for the ClamAV scanner (REST endpoint or clamd daemon). Leave null when useClamAv is false. |

## Constraints

Property rules:

- `useClamAv` must be present. Enforced only while `useClamAv` is on. (`REQUIRED_FIELD_MISSING`)
