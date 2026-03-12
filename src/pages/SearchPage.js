import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchMovies } from "../api/contentApi";
import SectionHeader from "../components/SectionHeader";
import MovieCard from "../components/MovieCard";
import styles from "./SearchPage.module.css";

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!q) {
        setItems([]);
        setError("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await searchMovies(q, { page: 1 });

        if (!alive) return;
        setItems(Array.isArray(res) ? res : []);
      } catch {
        if (!alive) return;
        setItems([]);
        setError("검색 결과를 불러오지 못했어.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [q]);

  const subtitle = useMemo(() => {
    if (!q) return "검색어를 입력해 주세요..";
    return `“${q}” 검색 결과`;
  }, [q]);

  return (
    <div className={styles.page}>
      <SectionHeader title="Search" subtitle={subtitle} />

      {!q && (
        <div className={styles.empty}>
          상단 검색바에서 영화 이름을 입력해 주세요.
        </div>
      )}

      {q && loading && <div className={styles.msg}>검색 중…</div>}
      {q && error && <div className={styles.err}>{error}</div>}

      {q && !loading && !error && !items.length && (
        <div className={styles.empty}>
          “{q}”에 대한 검색 결과가 없어요.
        </div>
      )}

      {q && !loading && !error && !!items.length && (
        <div className={styles.grid}>
          {items.map((movie) => (
            <MovieCard key={`search:${movie.id}`} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}