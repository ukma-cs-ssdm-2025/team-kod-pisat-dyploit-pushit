import { test, strict as assert } from "node:test";
import { isValidRating } from "../src/isValidRating.js";

test("allows 4.5 as a valid rating", () => {
  assert.equal(isValidRating(4.5), true);
});
