# ProjectSettings

**Level:** `chapter` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ProjectSettings in Part 2](../spec/ProjectSettings.md)

Defines the core configuration of your OpenAPPL project, including metadata, environment preferences, and infrastructure settings. Use this section to set up the project name, description, Stripe payment settings, AI provider settings, CORS configuration, and custom CI/CD pipeline templates.

## Contained in

- [Project](./Project.md) as `projectSettings`

Blueprint paths:

- `projectSettings`

## Contains

- `basicSettings`: [BasicProjectSettings](./BasicProjectSettings.md)
- `aiProvidersSettings`: [AiProvidersSettings](./AiProvidersSettings.md)
- `bucketProvidersSettings`: [BucketProvidersSettings](./BucketProvidersSettings.md)
- `computeSettings`: [ComputeSettings](./ComputeSettings.md)
- `graphProvidersSettings`: [GraphProvidersSettings](./GraphProvidersSettings.md)
- `bigLoadProvidersSettings`: [BigLoadProvidersSettings](./BigLoadProvidersSettings.md)
- `elasticLogsSettings`: [ElasticLogsSettings](./ElasticLogsSettings.md)
- `notificationProvidersSettings`: [NotificationProvidersSettings](./NotificationProvidersSettings.md)
- `paymentProvidersSettings`: [PaymentProvidersSettings](./PaymentProvidersSettings.md)
- `invoiceProvidersSettings`: [InvoiceProvidersSettings](./InvoiceProvidersSettings.md)
- `fiscalProvidersSettings`: [FiscalProvidersSettings](./FiscalProvidersSettings.md)
- `decisionProvidersSettings`: [DecisionProvidersSettings](./DecisionProvidersSettings.md)
- `socialLoginProvidersSettings`: [SocialLoginProvidersSettings](./SocialLoginProvidersSettings.md)
- `chatProvidersSettings`: [ChatProvidersSettings](./ChatProvidersSettings.md)
- `mcpbffSettings`: [McpbffSettings](./McpbffSettings.md)
- `amqpProvidersSettings`: [AmqpProvidersSettings](./AmqpProvidersSettings.md)
- `enterpriseIntegrationsSettings`: [EnterpriseIntegrationsSettings](./EnterpriseIntegrationsSettings.md)
- `videoProvidersSettings`: [VideoProvidersSettings](./VideoProvidersSettings.md)
- `mailAccountsSettings`: [MailAccountsSettings](./MailAccountsSettings.md)
- `clamAvSettings`: [ClamAvSettings](./ClamAvSettings.md)
- `corsSettings`: [CorsSettings](./CorsSettings.md)
- `pipelineTemplates`: [PipelineTemplate](./PipelineTemplate.md), a list
- `servicePlan`: [ServicePlanEntry](./ServicePlanEntry.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
