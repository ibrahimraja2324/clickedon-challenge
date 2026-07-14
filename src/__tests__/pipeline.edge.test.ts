import { expect, it, vi } from "vitest";
import { generate } from "../lib/pipeline";

it("does not advance or evaluate attempt 4 when review never passes", async () => {
  const reviewPasses = vi.fn((attempt: number) => {
    void attempt;
    return false;
  });
  const advanceToNextStage = vi.fn(async () => {});

  const result = await generate({
    behavior: "ok",
    reviewPasses,
    advanceToNextStage,
  });

  expect(result).toEqual({ status: "error", attempts: 3 });
  expect(advanceToNextStage).not.toHaveBeenCalled();
  expect(reviewPasses.mock.calls.map(([attempt]) => attempt)).toEqual([
    0, 1, 2, 3,
  ]);
});
