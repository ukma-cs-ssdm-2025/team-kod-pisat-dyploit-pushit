const { validateEmail } = require('../utils/validateEmail');

describe('validateEmail', () => {
  test('повертає true для коректного email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  test('повертає false для email без @', () => {
    expect(validateEmail('invalidemail.com')).toBe(false);
  });

  test('повертає false для пустого рядка', () => {
    expect(validateEmail('')).toBe(false);
  });
});