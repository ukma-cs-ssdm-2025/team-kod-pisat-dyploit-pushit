const isValidPassword = (password) => {
  const hasDigit = /\d/;
  return password.length >= 8 && hasDigit.test(password);
};

module.exports = { isValidPassword };