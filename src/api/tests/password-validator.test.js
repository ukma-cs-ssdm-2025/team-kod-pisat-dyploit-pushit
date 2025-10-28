const { isValidPassword } = require('../utils/password-validator.js');

test('should return false for password shorter than 8 chars', () => {
  expect(isValidPassword('123')).toBe(false);
});

test('should return true for password equal to 8 chars', () => {
  expect(isValidPassword('12345678')).toBe(true);
});

test('should return false for password with no digits', () => {
  expect(isValidPassword('abcdefgh')).toBe(false);
});

test('should return false for password with no special chars', () => {
  expect(isValidPassword('abcdefg1')).toBe(false);
});

test('should return true for a valid password', () => {
  expect(isValidPassword('ValidPass1!')).toBe(true);
});