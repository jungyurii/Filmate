export function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of arr || []) {
    const k = keyFn(item);
    if (k == null) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function xmur3(str) {
  let h = 1779033703 ^ (str?.length ?? 0);
  for (let i = 0; i < (str?.length ?? 0); i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSeeded(arr, seed = "seed") {
  const a = [...(arr || [])];
  const seedFn = xmur3(String(seed));
  const rand = mulberry32(seedFn());
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function take(arr, n) {
  return (arr || []).slice(0, n);
}

export function takeUnique(arr, n, usedSet, keyFn) {
  const out = [];
  for (const item of arr || []) {
    const k = keyFn(item);
    if (k == null) continue;
    if (usedSet.has(k)) continue;
    usedSet.add(k);
    out.push(item);
    if (out.length >= n) break;
  }
  return out;
}
