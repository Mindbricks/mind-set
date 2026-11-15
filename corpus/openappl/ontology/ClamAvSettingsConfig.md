# ClamAvSettingsConfig

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ClamAvSettingsConfig in Part 2](../spec/ClamAvSettingsConfig.md)

ClamAV connection configuration: protocol picks REST (url) or clamd INSTREAM (host:port), and scanTimeoutMs bounds every scan. With protocol null, a host other than the default ClamAV host (the field's default value) selects clamd, so a blueprint written for a self-hosted clamd keeps it; anything else selects REST against url (default: the platform ClamAV host). A scan that cannot run (unreachable, timeout, non-2xx, success=false, unparsable answer, a file over the REST service's 100 MB limit) is reported as a scan error, never as a detection, and CLAMAV_ON_ERROR decides whether it blocks.

## Contained in

- [ClamAvSettings](./ClamAvSettings.md) as `configuration`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
