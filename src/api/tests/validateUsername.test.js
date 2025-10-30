import { validateUsername } from "../utils/validateUsername.js";

test("[RED] forbids hyphen", () => {
  expect(() => validateUsername("john-doe")).toThrow();
});

