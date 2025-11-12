export function isValidRating(input) {
  const n = Number(input);
  if (!Number.isFinite(n)) return false;
  if (n < 0.5 || n > 5) return false;
  
 export function isValidRating(input) {
  const n = Number(input);
  if (!Number.isFinite(n)) return false;
  if (n < 0.5 || n > 5) return false;

  const scaled = n * 2;
  return Math.abs(scaled - Math.round(scaled)) < 1e-9;
}

