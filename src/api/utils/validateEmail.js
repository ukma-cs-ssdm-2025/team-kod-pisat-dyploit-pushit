function validateEmail(email) {
  return email.includes('@') && email.trim() !== '';
}

module.exports = { validateEmail };