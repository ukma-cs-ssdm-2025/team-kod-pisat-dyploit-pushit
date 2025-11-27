const isValidPassword = (password) => {
  const hasDigit = /\d/;
  const hasSpecial = /[!@#$%^&*]/;

  return password.length >= 8 &&
         hasDigit.test(password) &&
         hasSpecial.test(password);
};

module.exports = { isValidPassword };