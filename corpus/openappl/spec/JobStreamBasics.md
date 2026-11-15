# JobStreamBasics

**Level:** `section` · **Family:** [JobStream](../ontology/families.md#jobstream) (domain `Service`)

**Ontology:** [JobStreamBasics in Part 1](../ontology/JobStreamBasics.md)

**Name:** an instance is named by `name`.

Defines a job stream's identity, work topic, partition key and enqueue input schema. The job stream's scalar identity + axes (section): name/codeName/description, the Kafka job (work) topic, the optional `partitionKey` for worker consumer-group parallelism, and the enqueue `inputSchema` (the fields the enqueue edge accepts, mapped onto the target API input).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique job-stream identifier within the service. Drives the enqueue route base (`/jobstreams/<name>`), the SSE observation route, the default job (work) topic name, the worker consumer-group, and the asset-name-path. Must be a valid codeName. For services resolved to Java, authored Kafka listener names and group IDs are limited to 249 Unicode code points; longer values are refused at design time before Spring listener startup. This Java-specific bound does not refuse other service languages or unresolved contexts. |
| `codeName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Optional machine code name override. Defaults to `name` when absent. |
| `description` | `Text` | no |  |  |  | Optional human-readable description of what business job this stream runs. |
| `jobTopic` | `String` | no |  |  |  | The Kafka topic the enqueue edge produces onto and the worker controller consumes (the work queue). When absent, codegen derives `<projectCodename>-<service>-<name>-jobs` (the standard event-topic shape). |
| `partitionKey` | `String` | no |  |  |  | Optional name of an inputSchema field used as the Kafka partition key for worker consumer-group parallelism (so all messages for one entity process in order on one worker). When absent, jobs are round-robined across the consumer group. |
| `inputSchema` | [`JobStreamInputField`](./JobStreamInputField.md)[] | no |  |  |  | The input fields the enqueue edge accepts (JobStreamInputField[]). The enqueue handler validates the body against these and maps them onto the target BusinessApi input (per targetApi.inputMapping). Keep this the job's request payload — large inputs belong in a bucket, referenced by key. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `name`, `codeName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `inputSchema` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
