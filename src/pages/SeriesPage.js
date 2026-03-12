import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { discoverSeries, fetchSeriesSection, fetchTvGenres } from "../api/contentApi";
import SectionHeader from "../components/SectionHeader";
import RowScroller from "../components/RowScroller";
import MovieCard from "../components/MovieCard";
import styles from "./SeriesPage.module.css";

export default function SeriesPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const genre = params.get("genre") || "";
  const country = params.get("country") || "";
  const sort = params.get("sort") || "";
  const forceGrid = location.pathname === "/shows";
  const isFiltered = forceGrid || Boolean(genre || country || sort);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [list, setList] = useState([]);
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const gs = await fetchTvGenres();
        if (!alive) return;
        setGenres(Array.isArray(gs) ? gs : []);
      } catch {
        if (!alive) return;
        setGenres([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = sort === "onair"
          ? await fetchSeriesSection("/tv/on_the_air", { page: 1 })
          : await discoverSeries({
              page: 1,
              sortBy: "popularity.desc",
              withGenres: genre || undefined,
              withOriginCountry: country || undefined,
            });
        if (!alive) return;
        const tagged = (data || []).map((x) => ({ ...x, _type: forceGrid ? "show" : "tv" }));
        setList(tagged.slice(0, 24));
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "시리즈를 불러오지 못했어요.");
        setList([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [genre, country, sort, forceGrid]);

  const title = useMemo(() => {
    if (country === "JP" && genre === "16") return "일본 애니 시리즈";
    if (country === "CN") return "중국 본토 시리즈";
    if (!genre) return forceGrid ? "Shows" : "Series";
    const g = genres.find((x) => String(x.id) === String(genre));
    return g ? `${g.name} ${forceGrid ? "Shows" : "Series"}` : (forceGrid ? "Shows" : "Series");
  }, [country, forceGrid, genre, genres]);

  const subtitle = useMemo(() => {
    if (country && !genre) return `국가별 추천 · ${country}`;
    if (genre && !country) return "장르별 추천";
    return "지금 둘러보기 좋은 시리즈";
  }, [country, genre]);

  return (
    <div className={styles.page}>
      <SectionHeader title={title} subtitle={subtitle} />

      {loading && <div className={styles.msg}>불러오는 중…</div>}
      {error && <div className={styles.err}>{error}</div>}

      {!loading && !error && (
        isFiltered ? (
          <div className={styles.gridWrap}>
            <div className={styles.grid}>
              {list.map((t) => (
                <MovieCard key={t.id} movie={t} />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.row}>
            <RowScroller visible={6} step={2} gap={22}>
              {list.map((t) => (
                <MovieCard key={t.id} movie={t} />
              ))}
            </RowScroller>
          </div>
        )
      )}
    </div>
  );
}
