import { test, strict as assert } from "node:test";
import { isValidRating } from "../utils/isValidRating.js";

test("accepts valid ratings on .5 step within 0.5..5.0", () => {
  [0.5, 1, 1.5, 3.5, 5].forEach(v => assert.equal(isValidRating(v), true));
});

test("rejects value outside upper bound", () => {
  assert.equal(isValidRating(5.5), false);
});

test("rejects non-.5 step values", () => {
  [1.1, 2.25, 4.7].forEach(v => assert.equal(isValidRating(v), false));
});
