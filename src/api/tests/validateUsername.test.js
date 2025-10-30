import { validateUsername } from "../utils/validateUsername.js";

test("[RED] forbids hyphen", () => {
  expect(() => validateUsername("john-doe")).toThrow();
});

test("[RED] forbids spaces/symbols and rejects empty/non-string", () => {
  const bad = ["john doe", "john@doe", "", null, 123];
  bad.forEach((v) => {
    expect(() => validateUsername(v)).toThrow();
  });
});

test("[RED] allows valid usernames", () => {
  const valids = ["John", "john3", "_john.", ".A_", "__..", ".", "_"];
  valids.forEach((v) => {
    expect(validateUsername(v)).toBe(true);
  });
});

