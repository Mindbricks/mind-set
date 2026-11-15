# ClamAvSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ClamAvSettings in Part 2](../spec/ClamAvSettings.md)

Settings for the ClamAV scanner that checks files uploaded through DbBucket / NativeBucket / RemoteBucket when bucket.virusScan is true. When useClamAv is false (default) the runtime scanner uses the platform ClamAV REST service (POST `/api/v1/scan` on the default ClamAV host `clamav.mindbricks.com`, one file per request in the multipart field FILES, at most 100 MB per file). Use this block when you run your own ClamAV (a REST endpoint with the same contract, or a clamd daemon spoken to with INSTREAM), want to override the timeout, or want a default scan mode for buckets that don't set virusScanMode. The platform endpoint is plain HTTP as published: file bytes travel in clear text to that host.

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `clamAvSettings`

Blueprint paths:

- `projectSettings.clamAvSettings`

## Contains

- `configuration`: [ClamAvSettingsConfig](./ClamAvSettingsConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
