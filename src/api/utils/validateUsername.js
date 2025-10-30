const USERNAME_REGEX = /^[A-Za-z0-9._]+$/;

export function validateUsername(name) {
  if (typeof name !== "string" || name.length === 0) {
    throw new Error("Username must be a non-empty string");
  }
  if (!USERNAME_REGEX.test(name)) {
    throw new Error("Only A-Za-z, 0-9, '_' and '.' allowed");
  }
  return true;
}

