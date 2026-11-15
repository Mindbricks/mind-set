# SendWhatsAppAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [SendWhatsAppAction in Part 2](../spec/SendWhatsAppAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Sends a WhatsApp Business message using a configured WhatsApp provider — either Meta WhatsApp Cloud API (provider='whatsapp') or Twilio's WhatsApp channel (provider='twilio' with kind='whatsapp'). Supports free-form text sends inside the 24-hour customer-service window AND template-based sends (mandatory outside the window). With `template` set the provider sends the approved template: Meta sends `{ type: 'template', template: { name, language: { code }, components } }`, Twilio sends `{ contentSid, contentVariables }` with no body. Without it the message is free-form text, which Meta (131047) and Twilio (63016) refuse outside the window after accepting the request - design-time warning WHATSAPP_FREEFORM_OUTSIDE_WINDOW. LANGUAGE NOTE: the template send is implemented by the nodejs, dotnet and java actions and providers; the other language targets still send free-form text (ports pending).

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `sendWhatsAppActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.sendWhatsAppActions`
- `services.businessLogic.actions.sendWhatsAppActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
