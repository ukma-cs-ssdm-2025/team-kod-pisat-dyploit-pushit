import { test } from "node:test";
import assert from "node:assert/strict";
import ratingModule from "../utils/isValidRating.js";

const { isValidRating } = ratingModule;

test("accepts valid ratings on .5 step within 0.5..5.0", () => {
  [0.5, 1, 1.5, 3.5, 5].forEach(v => assert.equal(isValidRating(v), true));
});

test("rejects value outside upper bound", () => {
  assert.equal(isValidRating(5.5), false);
});

test("rejects non-.5 step values", () => {
  [1.1, 2.25, 4.7].forEach(v => assert.equal(isValidRating(v), false));
});

test("accepts numeric strings; rejects invalid strings", () => {
  assert.equal(isValidRating(" 4.0 "), true);
  assert.equal(isValidRating("4,0"), false);
  assert.equal(isValidRating("abc"), false);
});

test("rejects non-number inputs", () => {
  [null, undefined, NaN, {}, [], () => 1].forEach(v =>
    assert.equal(isValidRating(v), false)
  );
});

