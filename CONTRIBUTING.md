# Contributing to mind-set

Thank you for helping improve mind-set.

This repository is **built**: its content is generated from the source repository of the
OpenAPPL tooling and replaced on every release. A pull request here is still the right way
to report a mistake or propose a change. A maintainer carries an accepted change into the
source, and the next release brings it back here.

- **A wrong or unclear instruction in a skill or a procedure?** Open an issue with the file,
  the sentence and what an agent did because of it, or a pull request with the fix.
- **The validator accepts a broken blueprint, or rejects a valid one?** Open an issue with
  the smallest blueprint that shows it and the `mindset validate` output.
- **A change to the OpenAPPL language itself** (patterns, properties, rules) belongs to the
  OpenAPPL repository and its RFC process, not here.

Before a pull request, run the tests:

```bash
npm test
```

## AI and automated contributions

Everything sent to this repository is reviewed by people. For every pull request and issue:

- **A person is responsible.** You may use AI tools to help, but you write the
  contribution, you understand every line of it, and you can explain and defend it in
  review.
- **Say so.** If an AI tool helped produce the content, state it in the description in one
  line: which tool, and for what. Spelling and grammar help needs no mention.
- **No autonomous submissions.** Pull requests and issues opened by an agent or a bot on its
  own, without a person who wrote and stands behind them, are not accepted.
- **Low-effort submissions are closed** without a detailed review.

Using mind-set with an agent to write your own blueprints is what it is for, and is
welcome.

## Sign your commits

Every commit needs a Developer Certificate of Origin sign-off
(https://developercertificate.org). Add it with `git commit -s`.

Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md).
