export function isValidRating(input) {
  const n = normalizeNumber(input);
  if (!Number.isFinite(n)) return false;
  if (n < 0.5 || n > 5) return false;

  const scaled = n * 2;
  return Math.abs(scaled - Math.round(scaled)) < 1e-9;
}

function normalizeNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const parsed = Number.parseFloat(v.trim());
    return Number.isNaN(parsed) ? NaN : parsed; 
  }
  return NaN;
}

//no changes. tests must pass
