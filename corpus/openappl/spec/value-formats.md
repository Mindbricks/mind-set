# Value formats

A string property may name a format (the `valid` marker in `openappl.json`). The validator checks the value against it and reports the code shown with each format.

## codeName

A code identifier in camelCase (letters and digits, starting with a letter). A multi-word UPPER_CASE constant name is kept as written. Other spellings whose words survive are rewritten to camelCase with a warning; a value that would lose characters is refused. A reserved word of a target language gets a trailing `_` (`RESERVED_WORD_RENAMED`).

Reported as `INVALID_CODE_NAME_FORMAT`.

## lowerCamelCase

As `codeName`, without the UPPER_CASE-constant exception: the value always starts with a lower-case letter, because other names are derived from it.

Reported as `INVALID_CODE_NAME_FORMAT`.

## wireToken

An HTTP token (header or cookie name): ASCII letters, digits and ``! # $ % & ' * + - . ^ _ ` | ~``; no spaces or separators. Never rewritten.

Reported as `INVALID_WIRE_TOKEN_NAME`.

## wireKey

A URL query or JSON body key: printable ASCII only, no whitespace or control characters. Never rewritten.

Reported as `INVALID_WIRE_KEY_NAME`.

## noSpace

Any text without whitespace (package names, key names). Never rewritten.

Reported as `INVALID_NO_SPACE`.

## url

A URL without whitespace or control characters. The scheme and host are not checked, so relative values are accepted.

Reported as `INVALID_URL`.

## urlPath

A URL path: as `url`, and it must not carry a scheme.

Reported as `INVALID_URL_PATH`.

## dotPath

A dotted chain of property names, each optionally followed by a numeric index (`items[0].id`): no whitespace, no empty segment, no leading or trailing dot.

Reported as `INVALID_DOT_PATH`.
