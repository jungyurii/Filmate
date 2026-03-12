import { storage } from "./storage";
import { searchMovies } from "../api/contentApi";

const KEY = "filmate:content_match_map:v1";

function safeYear(openDt) {
  if (!openDt) return "";
  const s = String(openDt);
  if (s.includes("-")) return s.slice(0, 4);
  return s.slice(0, 4);
}

function normalizeTitle(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\(\)\[\]\{\}]/g, "")
    .trim();
}

function scoreCandidate({ sourceTitle, sourceYear }, candidate) {
  const targetTitle = normalizeTitle(candidate?.title);
  const baseTitle = normalizeTitle(sourceTitle);
  if (!targetTitle || !baseTitle) return 0;

  let score = 0;
  if (targetTitle === baseTitle) score += 10;
  if (targetTitle.includes(baseTitle) || baseTitle.includes(targetTitle)) score += 4;

  const targetYear = String(candidate?.year || "");
  if (sourceYear && targetYear) {
    const diff = Math.abs(Number(targetYear) - Number(sourceYear));
    if (diff === 0) score += 3;
    else if (diff === 1) score += 2;
    else if (diff <= 2) score += 1;
  }

  const popularity = Number(candidate?._raw?.popularity ?? 0);
  score += Math.min(2, popularity / 100);
  return score;
}

export function getContentMatchMap() {
  return storage.getJSON(KEY, {});
}

export function setContentMatchMap(next) {
  storage.setJSON(KEY, next);
}

export async function mapOneBoxOfficeToContent({ movieCd, movieNm, openDt }) {
  if (!movieCd || !movieNm) return null;

  const cachedMap = getContentMatchMap();
  if (cachedMap?.[movieCd]) return cachedMap[movieCd];

  const sourceYear = safeYear(openDt);
  const results = await searchMovies(movieNm, { page: 1 });
  if (!results?.length) return null;

  const scored = results
    .map((m) => ({ m, s: scoreCandidate({ sourceTitle: movieNm, sourceYear }, m) }))
    .sort((a, b) => b.s - a.s);

  const best = scored[0]?.m;
  if (!best?.id) return null;

  const entry = {
    candidateId: best.id,
    contentId: best.id,
    title: best.title,
    year: best.year,
    poster_path: best.poster_path,
    backdrop_path: best.backdrop_path,
    overview: best.overview || "",
  };

  const next = { ...cachedMap, [movieCd]: entry };
  setContentMatchMap(next);
  return entry;
}

export async function mapBoxOfficeListToContent(sourceList) {
  const out = [];
  for (const it of sourceList || []) {
    const entry = await mapOneBoxOfficeToContent({
      movieCd: it?.movieCd,
      movieNm: it?.movieNm,
      openDt: it?.openDt,
    }).catch(() => null);

    out.push({ source: it, map: entry });
  }
  return out;
}
