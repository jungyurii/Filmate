import React, { useEffect, useMemo, useState } from "react";
import { fetchUpcomingMovies } from "../api/boxOfficeApi";
import { mapBoxOfficeListToContent } from "../lib/contentMap";
import SectionHeader from "../components/SectionHeader";
import MovieCard from "../components/MovieCard";
import styles from "./ComingSoonPage.module.css";

export default function ComingSoonPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [list, setList] = useState([]); 

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        const upcoming = await fetchUpcomingMovies({ itemPer: 24 });
        const mapped = await mapBoxOfficeListToContent(upcoming);

        if (!alive) return;

        const merged = mapped
          .map((x) => {
            const contentId = x?.map?.contentId;
            if (!contentId) return null;
            const movie = {
              id: contentId,
              title: x?.map?.title || x?.source?.movieNm || "",
              year: x?.map?.year || (x?.source?.openDt || "").slice(0, 4),
              poster_path: x?.map?.poster_path,
              backdrop_path: x?.map?.backdrop_path,
              _raw: { release_date: x?.source?.openDt },
            };
            return { movie, source: x.source };
          })
          .filter(Boolean);

        setList(merged);
      } catch (e) {
        if (!alive) return;
        setError("개봉예정작을 불러오지 못했어요.");
        setList([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const subtitle = useMemo(
    () => "개봉 예정작",
    []
  );

  return (
    <div className={styles.page}>
      <SectionHeader title="Coming soon" subtitle={subtitle} />

      {loading && <div className={styles.msg}>불러오는 중…</div>}
      {error && <div className={styles.err}>{error}</div>}

      {!loading && !error && (
        <div className={styles.gridWrap}>
          <div className={styles.grid}>
            {(list || []).map((x) => (
              <MovieCard key={x.movie.id} movie={x.movie} />
            ))}
          </div>
        </div>
      )}

      {!loading && !error && !list.length && (
        <div className={styles.msg}>개봉 예정작이 비어 있어요.</div>
      )}
    </div>
  );
}
