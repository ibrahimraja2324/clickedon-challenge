import { extractJson } from "./extract-json";
import { mockStream, type MockBehavior, type MockState } from "./anthropic-mock";

export interface GenerateInput {
  /** Drives the mock streaming client (see anthropic-mock.ts). */
  behavior: MockBehavior;
  /** Hands the finished draft to the next pipeline stage. May reject. */
  advanceToNextStage: () => Promise<void>;
  /** Returns true once the draft passes review. Scripted by callers/tests. */
  reviewPasses: (attempt: number) => boolean;
}

export interface GenerateResult {
  status: "ok" | "error";
  attempts: number;
}

const MAX_REVISIONS = 3;
const MAX_GENERATION_ATTEMPTS = 3;

/**
 * Runs one content-generation pass: stream a draft, extract it, revise until it
 * passes review, then hand off to the next stage.
 *
 * This is a faithful (stripped-down) reproduction of the real pipeline — and it
 * ships with three real bugs from that pipeline. Your job is to fix them so the
 * test suite passes. See the README for the symptoms. (Do not edit the tests.)
 */
export async function generate(input: GenerateInput): Promise<GenerateResult> {
  const state: MockState = { calls: 0 };

  let generationSucceeded = false;
  for (
    let generationAttempt = 0;
    generationAttempt < MAX_GENERATION_ATTEMPTS;
    generationAttempt += 1
  ) {
    let text: string;

    try {
      text = await mockStream(input.behavior, state);
    } catch (error) {
      if (
        typeof error !== "object" ||
        error === null ||
        !("status" in error) ||
        error.status !== 429
      ) {
        return { status: "error", attempts: 0 };
      }
      continue;
    }

    try {
      extractJson(text);
      generationSucceeded = true;
      break;
    } catch {
      // Extraction failures consume this attempt; retry the complete operation.
    }
  }

  if (!generationSucceeded) {
    return { status: "error", attempts: 0 };
  }

  // Revise until the draft passes review.
  let attempt = 0;
  while (true) {
    let passed: boolean;
    try {
      passed = input.reviewPasses(attempt);
    } catch {
      return { status: "error", attempts: attempt };
    }

    if (passed) {
      break;
    }
    if (attempt === MAX_REVISIONS) {
      return { status: "error", attempts: MAX_REVISIONS };
    }
    attempt += 1;
  }

  try {
    await input.advanceToNextStage();
  } catch {
    return { status: "error", attempts: attempt };
  }

  return { status: "ok", attempts: attempt };
}

export { MAX_REVISIONS };
