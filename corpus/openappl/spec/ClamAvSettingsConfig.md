# ClamAvSettingsConfig

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ClamAvSettingsConfig in Part 1](../ontology/ClamAvSettingsConfig.md)

ClamAV connection configuration: protocol picks REST (url) or clamd INSTREAM (host:port), and scanTimeoutMs bounds every scan. With protocol null, a host other than the default ClamAV host (the field's default value) selects clamd, so a blueprint written for a self-hosted clamd keeps it; anything else selects REST against url (default: the platform ClamAV host). A scan that cannot run (unreachable, timeout, non-2xx, success=false, unparsable answer, a file over the REST service's 100 MB limit) is reported as a scan error, never as a detection, and CLAMAV_ON_ERROR decides whether it blocks.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `protocol` | `ClamAvProtocol` | no |  | `rest`, `clamd` |  | How the scanner talks to ClamAV: 'rest' (POST <url>/api/v1/scan, multipart field FILES, one file per request) or 'clamd' (INSTREAM over TCP to host:port). Null (default) means: clamd when host names a server other than the default ClamAV host (the field's default value), otherwise rest. The platform ClamAV host serves REST only, so clamd needs your own daemon in host. |
| `url` | `String` | no | `"http://clamav.mindbricks.com"` |  |  | (rest) Base URL of the ClamAV REST service; the scanner posts to <url>/api/v1/scan. Default: `clamav.mindbricks.com`, the platform ClamAV host. That endpoint is plain HTTP, so file bytes travel in clear text to it; use an https URL where your scanner offers one. Ignored when protocol resolves to clamd. |
| `host` | `String` | no | `"clamav.mindbricks.com"` |  |  | (clamd) Hostname of a self-hosted ClamAV daemon spoken to with INSTREAM. Default: `clamav.mindbricks.com`, which serves REST only. With protocol null, a host other than that one selects clamd; ignored when protocol is rest. |
| `port` | `Integer` | no | `3310` |  |  | (clamd) TCP port of the self-hosted ClamAV daemon (INSTREAM). Default: 3310. Ignored when protocol resolves to rest. |
| `scanTimeoutMs` | `Integer` | no | `30000` |  |  | Maximum time in milliseconds a scan may take (the whole HTTP call for rest, the socket session for clamd) before it is aborted. Default: 30000 (30s). A timed-out scan is a scan that could not run, not a detection: CLAMAV_ON_ERROR decides whether the upload is refused with 503 VIRUS_SCAN_UNAVAILABLE or accepted unscanned. |
| `defaultMode` | `BucketVirusScanMode` | no | `"block"` | `block`, `quarantine` |  | Default scan mode applied to buckets whose virusScan=true but didn't specify a virusScanMode. 'block' rejects infected uploads with 422; 'quarantine' persists them with scanStatus='infected' and refuses downloads. This is a FALLBACK, not an override: a bucket that sets its own virusScanMode keeps it. The winner is resolved per bucket at design time and baked into the generated service, so changing this value only affects buckets that left virusScanMode null. It is NOT the same knob as the CLAMAV_DEFAULT_MODE env var, which overrides the resolved value at runtime for every bucket in the process; do not wire a deployment to emit CLAMAV_DEFAULT_MODE from this field, because that would make the project default beat the per-bucket value and invert the documented precedence. Lane status: this design-time resolution is honoured in nodejs, dotnet, python, php and golang (golang bakes the resolved per-bucket literal into the bucket router and lets CLAMAV_DEFAULT_MODE override it in both directions), and rust honours it but cannot be overridden back down to 'block'. |

## Constraints

Property rules:

- `protocol`, `defaultMode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
