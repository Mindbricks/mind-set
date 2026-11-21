# ChatHandlerAction

Call the business API selected by a chat handler through its REST controller. Map the message arguments to API parameters and supply each required route segment. A failed call produces the handler's `response.errorText` and ends the attempt. The validator reports `CHAT_HANDLER_API_NO_REST` when the target has no REST controller and `CHAT_HANDLER_PATH_PARAM_UNMAPPED` when a route segment lacks a mapping.

See the [pattern reference](../../spec/ChatHandlerAction.md) and the [chat-handlers guide](../capabilities/chat-handlers.md).
