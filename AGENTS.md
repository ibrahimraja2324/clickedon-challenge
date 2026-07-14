# AGENTS.md

## Objective

Fix the content pipeline reliability bugs described by the existing tests and README.

## Protected Files

Do not modify:

* `src/__tests__/pipeline.test.ts`
* `.github/workflows/**`

The grader verifies these files are unchanged.

## Change Constraints

* Prefer the smallest correct change.
* Preserve existing exported interfaces.
* Keep model retries, review attempts, and hand-off handling separate.
* Do not hard-code behaviour only for visible tests.
* Do not add dependencies.
* Do not modify fixtures to alter test behaviour.
* Do not perform unrelated refactoring.
* Do not run `npm audit fix`.
* Do not commit automatically.

## Reliability Requirements

* Retry recoverable model-generation failures.
* Treat truncated or unparseable model output as a failed generation attempt.
* Keep every retry and review loop strictly bounded.
* Do not advance content that failed review.
* Await the next-stage hand-off.
* Surface final failures through the existing result type.

## Verification

Before declaring completion, run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Also verify that the protected test and workflow files are unchanged.

## Working Style

Before editing:

1. Read the README, tests, and relevant implementation files.
2. Explain the root cause of each failure.
3. Propose the smallest correct change.
4. Identify likely hidden edge cases.

After editing:

1. Review the diff.
2. Check for unbounded loops and swallowed errors.
3. Check for off-by-one attempt counting.
4. Confirm failed review never reaches the hand-off.
5. Report every command run and its result.
