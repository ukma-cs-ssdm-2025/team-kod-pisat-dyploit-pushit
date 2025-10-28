const { isValidPassword } = require('../utils/password-validator.js');

test('should return false for password shorter than 8 chars', () => {
  expect(isValidPassword('123')).toBe(false);
});