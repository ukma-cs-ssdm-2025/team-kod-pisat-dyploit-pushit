const isValidPassword = (password) => {
  const hasDigit = /\d/;

  if (password.length < 8) {
    return false;
  }
  if (!hasDigit.test(password)) {
    return false;
  }
  return true;
};

module.exports = { isValidPassword };