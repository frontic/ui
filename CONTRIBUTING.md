# Contributing to Frontic UI

## Issues

Issues are welcome: bugs, missing items, unclear docs. For a bug, name the CLI version (`npx @frontic/ui --version`), the command you ran and what it printed.

## Pull requests

This repository is generated from Frontic's private source repository. A pull request here is never merged directly:

1. CI checks it on GitHub-hosted runners. CI has no access to secrets.
2. A maintainer reviews it.
3. Once accepted, it is replayed into the source repository with a `Replays frontic/ui#<n>` trailer. You stay the commit's author, and your `Signed-off-by` line goes with it.
4. The sync workflow publishes it here and closes your pull request with a "landed in `<sha>`" comment.

A pull request should change one thing, come with a test that fails without it, and have every commit signed off (see Licence below).

## Setup

Node.js 24 and pnpm 9.

```sh
pnpm install
pnpm build
pnpm test
```

## Commit messages

Use `type(scope): description`, as conventional commits do. The types are feat, fix, docs, refactor, perf, test and chore. The scopes are cli, registry, registry-client and library-contract.

## Licence

Frontic UI is licensed under FSL-1.1-MIT (see [LICENSE](./LICENSE)), and a contribution comes in under the same licence.

Every commit carries a `Signed-off-by` line with your name and email, the ones the commit is authored with. The line certifies the [Developer Certificate of Origin 1.1](https://developercertificate.org): you wrote the change, or otherwise have the right to submit it under this licence. `git commit -s` adds the line. CI refuses a pull request with an unsigned commit. To sign commits you already made, run `git rebase --signoff main`, then force-push your branch.

When your pull request is replayed into the source repository, both the authorship and the `Signed-off-by` line go with it.
