export function isValidRating(input) {
  const n = Number(input);
  if (!Number.isFinite(n)) return false;
  if (n < 0.5 || n > 5) return false;
  return Number.isInteger(n * 2); 
}
