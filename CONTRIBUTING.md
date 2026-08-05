# Contributing to Quizingo

Quizingo is primarily a solo project, but it uses a pull-request workflow to keep `main` stable and every change easy to review. These guidelines also apply to occasional external contributors.

## Core Principles

- Keep `main` in a working, reviewable state.
- Make every change through a pull request, including documentation changes.
- Prefer small, focused changes over large mixed-purpose updates.
- Keep quiz topics and scoring configurable rather than hard-coded.
- Never commit credentials, tokens, private data, or local environment files.

## Branch Workflow

1. Start from an up-to-date `main` branch.
2. Create a short-lived branch for one coherent change.
3. Make and validate the change locally.
4. Review the complete diff yourself.
5. Push the branch and open a pull request.
6. Merge only after the PR is complete and all available checks pass.
7. Delete the branch after merging.

Use short, descriptive branch names with an appropriate prefix:

- `feat/interactive-board`
- `fix/wordle-letter-matching`
- `docs/explain-bingo-rules`
- `chore/add-ci-checks`

Avoid long-lived branches. Rebase or merge `main` into an active branch when necessary to resolve drift before merging.

## Commits

Each commit should represent one understandable step and leave the repository in a sensible state.

- Write a short imperative subject, such as `Add Black Hole bingo rules`.
- Explain why a change was necessary in the commit body when the reason is not obvious.
- Keep unrelated formatting, refactoring, content, and behavior changes in separate commits or PRs.
- Do not commit temporary files, editor settings, secrets, logs, or generated build artifacts.
- Do not rewrite or force-push history that another contributor may be using.

Conventional Commit prefixes are not required. Clarity is more important than a rigid message format.

## Pull Requests

Open a draft PR when work is incomplete or early feedback would help. Before marking it ready:

- Use a specific title that describes the outcome.
- Explain what changed and why.
- Link a relevant issue when one exists.
- List the validation performed and its result.
- Include screenshots for meaningful visual changes.
- Review every changed file and remove unrelated edits.
- Confirm that generated files are synchronized with their sources.

Use **squash merge** by default so each PR becomes one clear commit on `main`. Preserve individual commits only when they form a deliberate history that is useful on its own.

## Repository-Specific Sources of Truth

### Quiz configuration

[`quiz.config.json`](quiz.config.json) is authoritative for:

- topic display names;
- topic-to-question assignments; and
- every numerical scoring value.

Application code and generated documentation must read these values from the config. Do not duplicate them as independently maintained constants.

### Game rules

[`AGENTS.md`](AGENTS.md) is the authoritative specification for quiz behavior, formats, answering, passing, cell ownership, Black Holes, and Bingo rules. Keep implementations and user documentation consistent with it.

### Config-synchronized guide

[`GUIDE.md`](GUIDE.md) is both the readable guide and its editable source. Edit explanatory prose directly in that file. Topic-map content and scoring values enclosed by `quiz-config` markers are synchronized from [`quiz.config.json`](quiz.config.json); do not edit the generated marker contents manually. Synchronize them with:

```bash
node scripts/render-guide.mjs
```

Commit the config and synchronized guide changes together. Before opening a PR, rerun the command and confirm it creates no unexpected diff.

## Validation

Run the checks relevant to the files you changed. The repository currently has no general automated test suite or CI workflow, so do not claim checks that were not actually run.

For guide or config changes, run:

```bash
node scripts/render-guide.mjs
git diff --check
git diff
```

Confirm that:

- the guide synchronizes without obsolete template tokens or invalid topic assignments;
- topic assignments still cover the intended cells;
- scoring values shown in the guide match the config;
- rules in the guide and `AGENTS.md` do not contradict one another; and
- no unrelated or sensitive files appear in the diff.

As tests, linting, builds, or CI are added, document their exact commands here and require the relevant checks before merging.

## Issues and Planning

Use a GitHub issue when work benefits from discussion, acceptance criteria, or a durable record. Small, obvious maintenance tasks may go directly to a focused PR.

- Describe the problem or desired outcome, not only the proposed implementation.
- Record important decisions and acceptance criteria.
- Keep one issue focused on one outcome.
- Close issues through the PR when appropriate.

## Dependencies and Security

- Add a dependency only when its maintenance and security cost is justified.
- Prefer pinned lockfile-backed versions once a package manager is introduced.
- Review release notes and risk before upgrading dependencies.
- Never place secrets in source files, examples, issues, logs, screenshots, or PR descriptions.
- If a secret is committed, revoke and rotate it immediately; deleting it in a later commit is not sufficient.
- Enable dependency alerts, secret scanning, and automated security updates when available on GitHub.

Report a security concern privately to the repository owner rather than opening a public issue containing exploit or credential details.

## Releases

Create a release only from a reviewed commit on `main`. Use annotated version tags and release notes that summarize user-visible changes, fixes, known limitations, and any required migration steps. Do not reuse or move a published release tag.

Until the project defines a formal versioning policy, choose version numbers deliberately and document the rationale in the release PR.

## Recommended GitHub Settings

When the GitHub repository is connected, protect `main` with these defaults:

- require a pull request before merging;
- require conversation resolution;
- require available CI checks once workflows exist;
- prevent force pushes and branch deletion;
- enable automatic deletion of merged branches;
- allow squash merging as the default strategy; and
- enable vulnerability alerts and secret scanning where supported.

These controls protect the project from accidental changes while preserving a lightweight workflow suitable for a solo maintainer.
