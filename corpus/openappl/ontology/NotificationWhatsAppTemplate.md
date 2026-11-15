# NotificationWhatsAppTemplate

**Level:** `subsection` · **Family:** [EventNotification](./families.md#eventnotification) (domain `NotificationService`)

**Specification:** [NotificationWhatsAppTemplate in Part 2](../spec/NotificationWhatsAppTemplate.md)

An approved WhatsApp template for a jobType='whatsapp' EventNotification: the Meta template name or the Twilio Content SID, its language, and the parameter scripts. Business-initiated WhatsApp messages must be template messages: free-form text is delivered only inside the 24-hour customer-service window. `components` and `contentVariables` are MScripts evaluated ONCE per event, against the same receiver as eventDataSettings.includeData (`this.payload` the event record, `this.dataSource` the DataView document when dataViewName is set, `this.old`, `this.actor`, `this.metadata` - the finished notification metadata, includeData entries included - and the bare root `data` = `this.dataSource ?? this.payload`). A script that throws, or that returns a value of the wrong shape, fails the delivery visibly (failed NotificationDeliveryLog + NotificationLog rows naming the slot); nothing is sent as free-form text in its place. Only the slot the provider reads is used: Meta reads name / language / components, Twilio reads name / contentVariables. LANGUAGE NOTE: implemented by the nodejs and dotnet notification listeners and providers; the other language targets still send free-form text.

## Contained in

- [NotificationTemplate](./NotificationTemplate.md) as `whatsappTemplate`
- [NotificationTemplateVariant](./NotificationTemplateVariant.md) as `whatsappTemplate`

## Contains

- `buttons`: [WhatsAppTemplateButton](./WhatsAppTemplateButton.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
