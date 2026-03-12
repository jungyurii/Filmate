export function formatMinutes(min) {
  if (!Number.isFinite(min)) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

export function formatDateKR(isoDate) {
  // YYYY-MM-DD
  const [y, mo, d] = (isoDate || "").split("-").map(Number);
  if (!y || !mo || !d) return isoDate || "";
  return `${y}.${String(mo).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
}

export function normalizeTitle(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
