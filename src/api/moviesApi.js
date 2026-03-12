const BASE = "https://nomad-movies.nomadcoders.workers.dev";

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

async function fetchPage(page) {
  const url = page ? `${BASE}/movies?page=${page}` : `${BASE}/movies`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch movies");
  const data = await safeJson(res);
  return Array.isArray(data) ? data : [];
}

// Fetch multiple pages to reduce the "same movies everywhere" feeling.
// If the backend ignores page param, it will just duplicate — we de-dupe by id.
export async function fetchMovies({ pages = 4 } = {}) {
  const pageNums = Array.from({ length: Math.max(1, pages) }, (_, i) => i + 1);
  try {
    const results = await Promise.all(pageNums.map((p) => fetchPage(p)));
    const merged = results.flat();
    // de-dupe by id while keeping order
    const seen = new Set();
    const out = [];
    for (const m of merged) {
      const id = m?.id;
      if (id == null) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(m);
    }
    return out;
  } catch (e) {
    // fallback to single request
    return fetchPage();
  }
}

export async function fetchMovieById(id) {
  const res = await fetch(`${BASE}/movies/${id}`);
  if (!res.ok) throw new Error("Failed to fetch movie detail");
  return res.json();
}
