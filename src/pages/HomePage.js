import React, { useEffect, useMemo, useState } from "react";
import { fetchDailyBoxOffice } from "../api/boxOfficeApi";
import { discoverSeries, fetchLatestMixed } from "../api/contentApi";
import { mapBoxOfficeListToContent } from "../lib/contentMap";
import { storage } from "../lib/storage";
import MovieCard from "../components/MovieCard";
import RowScroller from "../components/RowScroller";
import SectionHeader from "../components/SectionHeader";
import Button from "../components/Button";
import { getBackdrop, getPoster } from "../lib/images";
import styles from "./HomePage.module.css";

function stripHtml(s) {
  return (s || "").replace(/<[^>]*>/g, "");
}

const WISHLIST_KEY = "filmate:wishlist";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [boxOffice, setBoxOffice] = useState([]); 
  const [featured, setFeatured] = useState(null);

  const [rows, setRows] = useState({
    new: [],
    emotional: [],
    jpAnime: [],
    china: [],
  });

  const wished = useMemo(() => {
    return storage.getJSON(WISHLIST_KEY, []) || [];
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const daily = await fetchDailyBoxOffice({ itemPer: 10 });
        const mapped = await mapBoxOfficeListToContent(daily);

        if (!alive) return;

        const merged = mapped
          .map((x) => {
            const contentId = x?.map?.contentId || x?.map?.candidateId;
            if (!contentId) return null;

            const movie = {
              id: contentId,
              title: x?.map?.title || x?.source?.movieNm || "",
              year: x?.map?.year || (x?.source?.openDt || "").slice(0, 4),
              poster_path: x?.map?.poster_path,
              backdrop_path: x?.map?.backdrop_path,
              _raw: { release_date: x?.source?.openDt, overview: x?.map?.overview || "" },
            };

            return { movie, source: x.source };
          })
          .filter(Boolean);

        setBoxOffice(merged);

        if (merged.length) {
          const pick = merged[Math.floor(Math.random() * merged.length)]?.movie;
          setFeatured(pick || merged[0].movie);
        } else {
          setFeatured(null);
        }
      } catch (e) {
        if (!alive) return;
        setError("박스오피스 데이터를 불러오지 못했어요.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [newOn, emotional, jpAnime, china] = await Promise.all([
          // 최신작
          fetchLatestMixed({ yearsBack: 2, limit: 18 }),

          // 감동적인 시리즈
          discoverSeries({ withGenres: 18, page: 1, sortBy: "popularity.desc" }).then((x) => (x || []).slice(0, 18)),

          // 일본 애니 시리즈
          discoverSeries({ withGenres: 16, withOriginCountry: "JP", page: 1, sortBy: "popularity.desc" }).then((x) => (x || []).slice(0, 18)),

          // 중국 본토 시리즈
          discoverSeries({ withOriginCountry: "CN", page: 1, sortBy: "popularity.desc" }).then((x) => (x || []).slice(0, 18)),
        ]);

        if (!alive) return;
        setRows({ new: newOn, emotional, jpAnime, china });
      } catch {
        if (!alive) return;
        setRows({ new: [], emotional: [], jpAnime: [], china: [] });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const heroBg = useMemo(() => {
    if (!featured) return "";
    return getBackdrop(featured) || getPoster(featured) || "";
  }, [featured]);

  return (
    <div className={styles.page}>
      <section className={styles.heroShell}>
        <div className={styles.heroCard}>
          <div className={styles.heroBg} style={{ backgroundImage: heroBg ? `url(${heroBg})` : undefined }} />
          <div className={styles.heroShade} />

          <div className={styles.heroInner}>
            <div className={styles.heroMetaLine}>
              <span className={styles.pill}>Movie</span>
              <span className={styles.pill}>KR</span>
              <span className={styles.pill}>Box Office</span>
              <span className={styles.pill}>6+</span>
            </div>

            <div className={styles.heroTitle}>{featured?.title || "Filmate"}</div>

            <div className={styles.heroDesc}>
              {featured?._raw?.overview
                ? stripHtml(featured._raw.overview).slice(0, 140) + "…"
                : ""}
            </div>

            <div className={styles.heroActions}>
              {featured && (
                <Button onClick={() => (window.location.href = `/movie/${featured.id}`)}>▶ Play</Button>
              )}
              {featured && (
                <Button variant="ghost" onClick={() => (window.location.href = `/movie/${featured.id}`)}>상세보기</Button>
              )}
            </div>
          </div>

          <button className={styles.heroLike} type="button" aria-label="좋아요">
            ♡
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader title="Box Office" subtitle="한국 박스오피스 기준" />

        {loading && <div className={styles.msg}>불러오는 중…</div>}
        {error && <div className={styles.err}>{error}</div>}

        {!loading && !error && (
          <div className={styles.rowWrap}>
            <RowScroller visible={6} step={2} gap={22}>
              {(boxOffice || []).map((x) => (
                <MovieCard key={x.movie.id} movie={x.movie} rank={Number(x?.source?.rank || 0) || undefined} />
              ))}
            </RowScroller>
          </div>
        )}
      </section>

      {/* ===== Netflix-like rows (TV only) ===== */}
      {wished?.length > 0 && (
        <section className={styles.section}>
          <SectionHeader title="내가 찜한 리스트" />
          <div className={styles.rowWrap}>
            <RowScroller visible={6} step={2} gap={22}>
              {wished.slice(0, 18).map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </RowScroller>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <SectionHeader title="새로 올라온 콘텐츠" subtitle="영화 · 시리즈 · 쇼" />
        <div className={styles.rowWrap}>
          <RowScroller visible={6} step={2} gap={22}>
            {(rows.new || []).map((t) => (
              <MovieCard key={`${t.media_type || t._type || "movie"}:${t.id}`} movie={t} />
            ))}
          </RowScroller>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader title="감동적인 시리즈" subtitle="드라마 시리즈 추천" />
        <div className={styles.rowWrap}>
          <RowScroller visible={6} step={2} gap={22}>
            {(rows.emotional || []).map((t) => (
              <MovieCard key={`tv:${t.id}`} movie={t} />
            ))}
          </RowScroller>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader title="일본 애니 시리즈" subtitle="애니메이션 시리즈 추천" />
        <div className={styles.rowWrap}>
          <RowScroller visible={6} step={2} gap={22}>
            {(rows.jpAnime || []).map((t) => (
              <MovieCard key={`tv:${t.id}`} movie={t} />
            ))}
          </RowScroller>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader title="중국 본토 시리즈" subtitle="중국 시리즈 추천" />
        <div className={styles.rowWrap}>
          <RowScroller visible={6} step={2} gap={22}>
            {(rows.china || []).map((t) => (
              <MovieCard key={`tv:${t.id}`} movie={t} />
            ))}
          </RowScroller>
        </div>
      </section>
    </div>
  );
}
