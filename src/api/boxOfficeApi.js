const BASE = process.env.REACT_APP_KOBIS_BASE || "https://kobis.or.kr/kobisopenapi/webservice/rest";
const KEY = process.env.REACT_APP_KOBIS_KEY || "";

function assertKey() {
  if (!KEY) throw new Error("박스오피스 서비스 설정이 비어 있어요. 환경 변수를 확인해 주세요.");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function kstYmd(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const kst = new Date(utc + 9 * 60 * 60 * 1000);
  const y = kst.getFullYear();
  const m = pad2(kst.getMonth() + 1);
  const d = pad2(kst.getDate());
  return `${y}${m}${d}`;
}

export function kstYesterdayYmd() {
  const utc = Date.now() + new Date().getTimezoneOffset() * 60 * 1000;
  const kst = new Date(utc + 9 * 60 * 60 * 1000);
  kst.setDate(kst.getDate() - 1);
  return kstYmd(kst);
}

export function kstTodayYmd() {
  return kstYmd(new Date());
}

function addDaysYmd(ymd, days) {
  const s = String(ymd || "");
  if (s.length !== 8) return "";
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6));
  const d = Number(s.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + Number(days || 0));
  const yy = dt.getUTCFullYear();
  const mm = pad2(dt.getUTCMonth() + 1);
  const dd = pad2(dt.getUTCDate());
  return `${yy}${mm}${dd}`;
}

async function fetchJson(path, params = {}) {
  assertKey();
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("key", KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`박스오피스 요청 실패 (${res.status}): ${msg}`.slice(0, 240));
  }
  return res.json();
}

export async function fetchDailyBoxOffice({ targetDt, itemPer = 10 } = {}) {
  const date = targetDt || kstYesterdayYmd();
  const data = await fetchJson("/boxoffice/searchDailyBoxOfficeList.json", {
    targetDt: date,
    itemPer,
  });
  return data?.boxOfficeResult?.dailyBoxOfficeList || [];
}

export async function fetchWeeklyBoxOffice({ targetDt, weekGb = "0", itemPer = 10 } = {}) {
  const date = targetDt || kstYesterdayYmd();
  const data = await fetchJson("/boxoffice/searchWeeklyBoxOfficeList.json", {
    targetDt: date,
    weekGb,
    itemPer,
  });
  return data?.boxOfficeResult?.weeklyBoxOfficeList || [];
}

export async function fetchUpcomingMovies({
  openStartDt,
  openEndDt,
  itemPer = 24,
  curPage = 1,
  daysAhead = 180,
} = {}) {
  const start = openStartDt || kstTodayYmd();
  const end = openEndDt || addDaysYmd(start, daysAhead);

  const normYmd = (v) => String(v || "").replaceAll("-", "");
  const isFutureOrToday = (openDt) => {
    const x = normYmd(openDt);
    return x.length === 8 && x >= start; // start가 오늘(기본)
  };

  const tryFetch = async (params) => {
    const data = await fetchJson("/movie/searchMovieList.json", {
      curPage,
      itemPerPage: itemPer * 3, // ✅ 여유 있게 뽑아서 필터 후 itemPer 맞춤
      ...params,
    });
    return data?.movieListResult?.movieList || [];
  };

  let list = [];

  try {
    list = await tryFetch({
      openStartDt: start,
      openEndDt: end,
      prdtStatNm: "개봉예정",
    });
  } catch {}

  if (!list.length) {
    try {
      list = await tryFetch({
        openStartDt: start,
        openEndDt: end,
      });
    } catch {}
  }

  if (!list.length) {
    try {
      list = await tryFetch({
        prdtStatNm: "개봉예정",
      });
    } catch {
      list = [];
    }
  }

  const filtered = (list || []).filter((m) => {
    const od = normYmd(m?.openDt);
    if (od.length !== 8) return false;      // openDt 없는 애는 개봉예정에선 버림
    if (od < start) return false;           // 과거 제거 (2018 방지)
    if (od > end) return false;             // 너무 먼 미래도 제거(원하면 삭제 가능)
    return true;
  });

  filtered.sort((a, b) => normYmd(a?.openDt).localeCompare(normYmd(b?.openDt)));

  return filtered.slice(0, itemPer);
}
