export function validateUsername(name) {
  if ((name ?? "").includes("-")) {
    throw new Error("Forbidden character '-'");
  }
  return true;
}

