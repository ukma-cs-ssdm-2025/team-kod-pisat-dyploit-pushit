const isValidPassword = (password) => {
  const hasDigit = /\d/;
  const hasSpecial = /[!@#$%^&*]/;

  if (password.length < 8) return false;
  if (!hasDigit.test(password)) return false;
  if (!hasSpecial.test(password)) return false;

  return true;
};

module.exports = { isValidPassword };