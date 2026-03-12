const BASE = process.env.REACT_APP_TMDB_BASE || "https://api.themoviedb.org/3";
const KEY = process.env.REACT_APP_TMDB_KEY || "";
const TOKEN = process.env.REACT_APP_TMDB_TOKEN || "";


async function fetchJson(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });

  if (!TOKEN) {
    if (!KEY) throw new Error("콘텐츠 서비스 설정이 비어 있어요. 환경 변수를 확인해 주세요.");
    url.searchParams.set("api_key", KEY);
  }

  // default language + safe options
  if (!url.searchParams.get("language")) url.searchParams.set("language", "ko-KR");
  if (!url.searchParams.get("include_adult")) url.searchParams.set("include_adult", "false");

  const res = await fetch(url.toString(), {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : undefined,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`콘텐츠 요청 실패 (${res.status}): ${msg}`.slice(0, 240));
  }
  return res.json();
}

function yearFromDate(d) {
  if (!d || typeof d !== "string") return "";
  return d.slice(0, 4);
}

let _movieGenreMap = null;
let _tvGenreMap = null;

async function getMovieGenreMap() {
  if (_movieGenreMap) return _movieGenreMap;

  
  try {
    const cached = sessionStorage.getItem("filmate_movie_genres_v1");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === "object") {
        _movieGenreMap = parsed;
        return _movieGenreMap;
      }
    }
  } catch {}

  const data = await fetchJson("/genre/movie/list", {});
  const map = {};
  for (const g of data?.genres || []) map[g.id] = g.name;
  _movieGenreMap = map;

  try { sessionStorage.setItem("filmate_movie_genres_v1", JSON.stringify(map)); } catch {}
  return map;
}

async function getTvGenreMap() {
  if (_tvGenreMap) return _tvGenreMap;

  try {
    const cached = sessionStorage.getItem("filmate_series_genres_v1");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === "object") {
        _tvGenreMap = parsed;
        return _tvGenreMap;
      }
    }
  } catch {}

  const data = await fetchJson("/genre/tv/list", {});
  const map = {};
  for (const g of data?.genres || []) map[g.id] = g.name;
  _tvGenreMap = map;

  try { sessionStorage.setItem("filmate_series_genres_v1", JSON.stringify(map)); } catch {}
  return map;
}

function normalizeListMovie(m, genreMap) {
  if (!m) return null;
  const genres = Array.isArray(m.genre_ids)
    ? m.genre_ids.map((id) => ({ id, name: genreMap?.[id] || String(id) }))
    : Array.isArray(m.genres)
      ? m.genres
      : [];

  return {
    id: m.id,
    title: m.title || m.name || "",
    overview: m.overview || "",
    year: yearFromDate(m.release_date || m.first_air_date),
    rating: typeof m.vote_average === "number" ? m.vote_average : (m.rating ?? 0),
    runtime: m.runtime, // usually undefined for list items
    genres,
    genre_ids: m.genre_ids,
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    release_date: m.release_date,
    media_type: "movie",
    _raw: m,
  };
}

function normalizeListTv(t, genreMap) {
  if (!t) return null;
  const genres = Array.isArray(t.genre_ids)
    ? t.genre_ids.map((id) => ({ id, name: genreMap?.[id] || String(id) }))
    : Array.isArray(t.genres)
      ? t.genres
      : [];

  return {
    id: t.id,
    title: t.name || t.original_name || "",
    overview: t.overview || "",
    year: yearFromDate(t.first_air_date),
    rating: typeof t.vote_average === "number" ? t.vote_average : (t.rating ?? 0),
    runtime: Array.isArray(t.episode_run_time) ? t.episode_run_time?.[0] : undefined,
    genres,
    genre_ids: t.genre_ids,
    poster_path: t.poster_path,
    backdrop_path: t.backdrop_path,
    first_air_date: t.first_air_date,
    media_type: "tv",
    _raw: t,
  };
}

function normalizeDetailTv(t) {
  if (!t) return null;
  return {
    id: t.id,
    title: t.name || t.original_name || "",
    overview: t.overview || "",
    year: yearFromDate(t.first_air_date),
    rating: typeof t.vote_average === "number" ? t.vote_average : (t.rating ?? 0),
    runtime: Array.isArray(t.episode_run_time) ? t.episode_run_time?.[0] : undefined,
    genres: Array.isArray(t.genres) ? t.genres : [],
    poster_path: t.poster_path,
    backdrop_path: t.backdrop_path,
    first_air_date: t.first_air_date,
    homepage: t.homepage,
    tagline: t.tagline,
    status: t.status,
    media_type: "tv",
    _raw: t,
  };
}

function normalizeDetailMovie(m) {
  if (!m) return null;
  return {
    id: m.id,
    title: m.title || m.name || "",
    overview: m.overview || "",
    year: yearFromDate(m.release_date || m.first_air_date),
    rating: typeof m.vote_average === "number" ? m.vote_average : (m.rating ?? 0),
    runtime: m.runtime,
    genres: Array.isArray(m.genres) ? m.genres : [],
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    release_date: m.release_date,
    homepage: m.homepage,
    tagline: m.tagline,
    status: m.status,
    media_type: "movie",
    _raw: m,
  };
}

function pickDateForItem(x){
  const r = x?.release_date || x?._raw?.release_date;
  const f = x?.first_air_date || x?._raw?.first_air_date;
  return r || f || "";
}

function filterRecent(items, { yearsBack = 2 } = {}){
  const nowY = new Date().getFullYear();
  const minY = nowY - Math.max(0, yearsBack);
  return (items || []).filter((x) => {
    const y = Number((x?.year || "").slice?.(0,4) || x?.year);
    if (!Number.isFinite(y)) return false;
    return y >= minY;
  });
}

function mergeUniqueById(arrays) {
  const seen = new Set();
  const out = [];
  for (const a of arrays) {
    for (const m of a || []) {
      const id = m?.id;
      const key = `${m?.media_type || "movie"}:${id}`;
      if (!id || seen.has(key)) continue;
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}



export async function fetchMovies({ pages = 2 } = {}) {
  const genreMap = await getMovieGenreMap();

  const maxPage = 20;
  const want = Math.max(1, pages);
    const pageNums = Array.from({ length: want }, () => 1 + Math.floor(Math.random() * maxPage));

  const calls = [];
  for (const p of pageNums) {
    calls.push(fetchJson("/movie/popular", { page: p }));
    calls.push(fetchJson("/movie/top_rated", { page: p }));
  }
  // One-page only endpoints (enough variety)
  calls.push(fetchJson("/movie/now_playing", { page: 1 }));
  calls.push(fetchJson("/trending/movie/week", {}));
  calls.push(fetchJson("/movie/upcoming", { page: 1 }));

  const results = await Promise.allSettled(calls);
  const lists = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value?.results || [])
    .map((list) => list.map((m) => normalizeListMovie(m, genreMap)).filter(Boolean));

  return mergeUniqueById(lists);
}

export async function fetchMovieById(id) {
  const data = await fetchJson(`/movie/${id}`, {});
  return normalizeDetailMovie(data);
}


export async function fetchMovieCredits(id) {
  const data = await fetchJson(`/movie/${id}/credits`, {});
  return data || {};
}

export async function fetchMovieExternalIds(id) {
  const data = await fetchJson(`/movie/${id}/external_ids`, {});
  return data || {};
}

export async function fetchGenres() {
  const data = await fetchJson(`/genre/movie/list`, {});
  return data?.genres || [];
}

export async function fetchDiscoverByGenre(genreId, { page = 1, sortBy = "popularity.desc", region = "KR", withOriginalLanguage = "ko" } = {}) {
  const genreMap = await getMovieGenreMap();
  const data = await fetchJson(`/discover/movie`, {
    with_genres: genreId,
    page,
    sort_by: sortBy,
    region,
    with_original_language: withOriginalLanguage,
  });
  return (data?.results || []).map((m) => normalizeListMovie(m, genreMap)).filter(Boolean);
}

export async function fetchSection(path, { page = 1 } = {}) {
  const genreMap = await getMovieGenreMap();
  const data = await fetchJson(path, { page });
  return (data?.results || []).map((m) => normalizeListMovie(m, genreMap)).filter(Boolean);
}

export async function searchMovies(query, { page = 1 } = {}) {
  if (!query) return [];
  const genreMap = await getMovieGenreMap();
  const data = await fetchJson("/search/movie", { query, page });
  return (data?.results || []).map((m) => normalizeListMovie(m, genreMap)).filter(Boolean);
}

export async function discoverByGenre(genreId, { page = 1, sortBy = "popularity.desc", region = "KR", withOriginalLanguage = "ko" } = {}) {
  const genreMap = await getMovieGenreMap();
  const data = await fetchJson("/discover/movie", {
    with_genres: genreId,
    page,
    sort_by: sortBy,
  });
  return (data?.results || []).map((m) => normalizeListMovie(m, genreMap)).filter(Boolean);
}

// ---------- TV (Series) ----------

export async function fetchTvGenres() {
  const data = await fetchJson(`/genre/tv/list`, {});
  return data?.genres || [];
}

export async function fetchSeriesById(id) {
  const data = await fetchJson(`/tv/${id}`, {});
  return normalizeDetailTv(data);
}

export async function fetchSeriesCredits(id) {
  const data = await fetchJson(`/tv/${id}/credits`, {});
  return data || {};
}

export async function searchSeries(query, { page = 1 } = {}) {
  if (!query) return [];
  const genreMap = await getTvGenreMap();
  const data = await fetchJson("/search/tv", { query, page });
  return (data?.results || []).map((t) => normalizeListTv(t, genreMap)).filter(Boolean);
}

export async function discoverSeries({
  page = 1,
  sortBy = "popularity.desc",
  withGenres,
  withOriginCountry,
} = {}) {
  const genreMap = await getTvGenreMap();
  const data = await fetchJson("/discover/tv", {
    page,
    sort_by: sortBy,
    with_genres: withGenres,
    with_origin_country: withOriginCountry,
  });
  return (data?.results || []).map((t) => normalizeListTv(t, genreMap)).filter(Boolean);
}

export async function fetchSeriesSection(path, { page = 1 } = {}) {
  const genreMap = await getTvGenreMap();
  const data = await fetchJson(path, { page });
  return (data?.results || []).map((t) => normalizeListTv(t, genreMap)).filter(Boolean);
}

// "최신작" (무비/시리즈/쇼 합쳐서) — 너무 오래된 것(예: 1999) 섞이는 거 방지
export async function fetchLatestMixed({ yearsBack = 2, limit = 24 } = {}){
  const [movies, tvA, tvB] = await Promise.all([
    fetchSection("/movie/now_playing", { page: 1 }).catch(() => []),
    fetchSeriesSection("/tv/on_the_air", { page: 1 }).catch(() => []),
    fetchSeriesSection("/tv/airing_today", { page: 1 }).catch(() => []),
  ]);

  const merged = mergeUniqueById([movies, tvA, tvB]);
  const recent = filterRecent(merged, { yearsBack });

  // 날짜 내림차순 정렬(가능한 경우)
  recent.sort((a, b) => {
    const da = pickDateForItem(a);
    const db = pickDateForItem(b);
    return String(db).localeCompare(String(da));
  });

  return recent.slice(0, limit);
}

// 현재 상영작 ID Set 가져오기
export async function fetchNowPlayingIdSet({ pages = 3 } = {}) {
  const results = await Promise.allSettled(
    Array.from({ length: pages }, (_, i) => fetchSection("/movie/now_playing", { page: i + 1 }))
  );

  const ids = new Set();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const m of r.value || []) {
      if (m?.id) ids.add(m.id);
    }
  }
  return ids;
}

export async function fetchUpcomingMovies({
  page = 1,
  region = "KR",
  daysAhead = 180,
} = {}) {
  const genreMap = await getMovieGenreMap();

    // 1) upcoming 먼저 가져오고
  const up = await fetchJson("/movie/upcoming", { page, region });

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const gte = `${yyyy}-${mm}-${dd}`;

  const until = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const uyyyy = until.getFullYear();
  const umm = String(until.getMonth() + 1).padStart(2, "0");
  const udd = String(until.getDate()).padStart(2, "0");
  const lte = `${uyyyy}-${umm}-${udd}`;

  // 2) 날짜 필터로 확실히 거르기 (오늘~N일)
  const filtered = (up?.results || [])
    .filter((m) => m?.release_date && m.release_date >= gte && m.release_date <= lte)
    .map((m) => normalizeListMovie(m, genreMap))
    .filter(Boolean);

  // 같은 영화 중복 방지
  return mergeUniqueById([filtered]);
}