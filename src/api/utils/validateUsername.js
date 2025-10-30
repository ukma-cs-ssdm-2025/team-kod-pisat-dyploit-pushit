const USERNAME_REGEX = /^[A-Za-z0-9._]+$/;

const ERR_NONEMPTY = "Username must be a non-empty string";
const ERR_ALLOWED  = "Only A-Za-z, 0-9, '_' and '.' allowed";

function validateUsername(name) {
  if (typeof name !== "string" || name.length === 0) {
    throw new Error(ERR_NONEMPTY);
  }
  if (!USERNAME_REGEX.test(name)) {
    throw new Error(ERR_ALLOWED);
  }
  return true;
}


module.exports = { validateUsername };