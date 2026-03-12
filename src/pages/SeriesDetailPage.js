import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchSeriesById, fetchSeriesCredits } from "../api/contentApi";
import Button from "../components/Button";
import RatingStars from "../components/RatingStars";
import SectionHeader from "../components/SectionHeader";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import { useReviews } from "../hooks/useReviews";
import { useWishlist } from "../hooks/useWishlist";
import { formatMinutes } from "../lib/format";
import { getBackdrop, getPoster } from "../lib/images";
import { Heart, MessageSquareText } from "lucide-react";
import styles from "./DetailPage.module.css";

function stripHtml(s) {
  return (s || "").replace(/<[^>]*>/g, "");
}

export default function SeriesDetailPage() {
  const { id } = useParams();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const [series, setSeries] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const contentType = location.pathname.startsWith("/shows/") ? "show" : "tv";
  const reviewKey = `${contentType}:${id}`;

  const {
    reviews,
    addReview,
    updateReview,
    removeReview,
    toggleLike,
    addReply,
    removeReply,
    summary,
  } = useReviews(reviewKey);

  const { isWished, toggleWish } = useWishlist();
  const [wishPop, setWishPop] = useState(false);
  const reviewsRef = useRef(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [data, c] = await Promise.all([
          fetchSeriesById(id),
          fetchSeriesCredits(id).catch(() => null),
        ]);

        if (!alive) return;

        setSeries(data);
        setCredits(c);
      } catch (e) {
        if (!alive) return;
        setError("시리즈 상세를 불러오지 못했어요.");
        setSeries(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const bgUrl = useMemo(() => {
    if (!series) return "";
    return getBackdrop(series) || getPoster(series);
  }, [series]);

  const castLine = useMemo(() => {
    const list = credits?.cast || [];
    return list
      .slice(0, 6)
      .map((p) => p.name)
      .filter(Boolean)
      .join(", ") || "-";
  }, [credits]);

  const creatorLine = useMemo(() => {
    const raws = series?._raw;
    const creators = raws?.created_by || [];
    return (
      creators
        .map((c) => c.name)
        .filter(Boolean)
        .slice(0, 2)
        .join(", ") || "-"
    );
  }, [series]);

  const voteCount = series?._raw?.vote_count;

  if (loading) return <div className={styles.wrap}>불러오는 중…</div>;
  if (error || !series) {
    return <div className={styles.wrap}>시리즈를 찾지 못했어요.</div>;
  }

  const itemMeta = {
    type: contentType,
    id: series?.id,
    title: series?.title || series?.name || "",
    year:
      (series?.first_air_date || series?._raw?.first_air_date || "").slice(0, 4) ||
      series?.year ||
      "",
    posterPath: series?._raw?.poster_path || series?.poster_path || "",
    posterUrl: getPoster(series),
  };

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <div
          className={styles.bg}
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
        <div className={styles.shade} />

        <div className={styles.inner}>
          <img
            className={styles.poster}
            src={getPoster(series)}
            alt={series.title || series.name}
          />

          <div className={styles.info}>
            <div className={styles.kicker}>SERIES</div>
            <h1 className={styles.title}>{series.title || series.name}</h1>

            <div className={styles.subline}>
              <span>{series.year || "-"}</span>
              <span className={styles.dot}>•</span>
              <span>
                {series.runtime
                  ? `${formatMinutes(series.runtime)}(1ep)`
                  : "러닝타임 정보 없음"}
              </span>
              {!!series.first_air_date && (
                <>
                  <span className={styles.dot}>•</span>
                  <span>{series.first_air_date}</span>
                </>
              )}
            </div>

            <div className={styles.ratings}>
              <div className={styles.score}>
                {summary.count ? summary.avg.toFixed(1) : "-"}
              </div>
              <div className={styles.scoreHint}>예상 별점</div>
              <RatingStars value={summary.avg} />
              <div className={styles.reviewHint}>
                평균 {Number(series.rating || 0).toFixed(1)} (
                {voteCount ? `${voteCount.toLocaleString()}명` : "평가 집계 중"})
              </div>
            </div>

            <p className={styles.desc}>
              {stripHtml(series.overview) || "줄거리 정보가 없어요."}
            </p>

            <div className={styles.actions}>
              <Link to="/" className={styles.linkReset}>
                <Button variant="ghost">홈으로</Button>
              </Link>

              <button
                type="button"
                className={`${styles.iconBtn} ${styles.wishBtn} ${
                  wishPop ? styles.iconPop : ""
                } ${isWished(series.id, "tv") ? styles.iconOn : ""}`}
                onClick={() => {
                  toggleWish(series, "tv");
                  setWishPop(true);
                  window.setTimeout(() => setWishPop(false), 450);
                }}
                aria-label="찜"
                title="찜"
              >
                <span className={styles.burst} aria-hidden="true" />
                <Heart
                  size={18}
                  fill={isWished(series.id, "tv") ? "currentColor" : "none"}
                />
                <span className={styles.iconText}>찜</span>
              </button>

              <button
                type="button"
                className={styles.iconBtn}
                onClick={() =>
                  reviewsRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                aria-label="코멘트"
                title="코멘트"
              >
                <MessageSquareText size={18} />
                <span className={styles.iconText}>코멘트</span>
                <span className={styles.badge}>{summary.count || 0}</span>
              </button>
            </div>

            <div className={styles.tags}>
              {(series.genres || []).slice(0, 6).map((g) => (
                <span key={g.id || g.name} className={styles.tag}>
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          <aside className={styles.side}>
            <div className={styles.sideCard}>
              <div className={styles.sideTitle}>정보</div>

              <div className={styles.people}>
                <div className={styles.peopleRow}>
                  <div className={styles.peopleLabel}>출연</div>
                  <div className={styles.peopleValue}>{castLine}</div>
                </div>

                <div className={styles.peopleRow}>
                  <div className={styles.peopleLabel}>제작</div>
                  <div className={styles.peopleValue}>{creatorLine}</div>
                </div>

                <div className={styles.peopleRow}>
                  <div className={styles.peopleLabel}>장르</div>
                  <div className={styles.peopleValue}>
                    {(series.genres || [])
                      .map((g) => g.name)
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.section} ref={reviewsRef}>
        <SectionHeader title={`코멘트 ${summary.count ? summary.count : ""}`.trim()} />

        <ReviewForm itemMeta={itemMeta} onSubmit={addReview} />

        <ReviewList
          reviews={reviews}
          itemMeta={itemMeta}
          onRemove={removeReview}
          onUpdateReview={updateReview}
          onToggleLike={toggleLike}
          onAddReply={addReply}
          onRemoveReply={removeReply}
        />
      </section>
    </div>
  );
}