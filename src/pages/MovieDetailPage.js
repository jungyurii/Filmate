import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchMovieById,
  fetchMovieCredits,
  fetchNowPlayingIdSet,
} from "../api/contentApi";
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

export default function MovieDetailPage() {
  const { id } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    reviews,
    addReview,
    updateReview,
    removeReview,
    toggleLike,
    addReply,
    removeReply,
    summary,
  } = useReviews(`movie:${id}`);

  const { isWished, toggleWish } = useWishlist();
  const [canBook, setCanBook] = useState(false);
  const [wishPop, setWishPop] = useState(false);
  const reviewsRef = useRef(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchMovieById(id);

        const [c, nowSet] = await Promise.all([
          fetchMovieCredits(id).catch(() => null),
          fetchNowPlayingIdSet({ pages: 3 }).catch(() => new Set()),
        ]);

        if (!alive) return;

        setMovie(data);
        setCredits(c);
        setCanBook(nowSet.has(Number(id)));
      } catch (e) {
        if (!alive) return;
        setError("영화 상세를 불러오지 못했어요.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const bgUrl = useMemo(() => {
    if (!movie) return "";
    return getBackdrop(movie) || getPoster(movie);
  }, [movie]);

  const castLine = useMemo(() => {
    const list = credits?.cast || [];
    return list
      .slice(0, 6)
      .map((p) => p.name)
      .filter(Boolean)
      .join(", ") || "-";
  }, [credits]);

  const directorLine = useMemo(() => {
    const crew = credits?.crew || [];
    const ds = crew
      .filter((c) => c.job === "Director")
      .map((c) => c.name)
      .filter(Boolean);

    return ds.slice(0, 2).join(", ") || "-";
  }, [credits]);

  const voteCount = movie?._raw?.vote_count;

  if (loading) return <div className={styles.wrap}>불러오는 중…</div>;
  if (error || !movie) {
    return <div className={styles.wrap}>영화를 찾지 못했어요.</div>;
  }

  const itemMeta = {
    type: "movie",
    id: movie?.id,
    title: movie?.title || "",
    year: (movie?.release_date || "").slice(0, 4) || movie?.year || "",
    posterPath: movie?._raw?.poster_path || movie?.poster_path || "",
    posterUrl: getPoster(movie),
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
            src={getPoster(movie)}
            alt={movie.title}
          />

          <div className={styles.info}>
            <div className={styles.kicker}>MOVIE</div>
            <h1 className={styles.title}>{movie.title}</h1>

            <div className={styles.subline}>
              <span>{movie.year || "-"}</span>
              <span className={styles.dot}>•</span>
              <span>
                {movie.runtime
                  ? formatMinutes(movie.runtime)
                  : "러닝타임 정보 없음"}
              </span>
              {!!movie.release_date && (
                <>
                  <span className={styles.dot}>•</span>
                  <span>{movie.release_date}</span>
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
                평균 {Number(movie.rating || 0).toFixed(1)} (
                {voteCount ? `${voteCount.toLocaleString()}명` : "평가 집계 중"})
              </div>
            </div>

            <p className={styles.desc}>
              {stripHtml(movie.overview) || "줄거리 정보가 없어요."}
            </p>

            <div className={styles.actions}>
              {canBook && (
                <Link to={`/book/${movie.id}`} className={styles.linkReset}>
                  <Button size="lg">예매하기</Button>
                </Link>
              )}

              <button
                type="button"
                className={`${styles.iconBtn} ${styles.wishBtn} ${wishPop ? styles.iconPop : ""
                  } ${isWished(movie.id, "movie") ? styles.iconOn : ""}`}
                onClick={() => {
                  toggleWish(movie, "movie");
                  setWishPop(true);
                  window.setTimeout(() => setWishPop(false), 450);
                }}
                aria-label="찜"
                title="찜"
              >
                <span className={styles.burst} aria-hidden="true" />
                <Heart
                  size={18}
                  fill={isWished(movie.id, "movie") ? "currentColor" : "none"}
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
              {(movie.genres || []).slice(0, 6).map((g) => (
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
                  <div className={styles.peopleLabel}>감독</div>
                  <div className={styles.peopleValue}>{directorLine}</div>
                </div>

                <div className={styles.peopleRow}>
                  <div className={styles.peopleLabel}>장르</div>
                  <div className={styles.peopleValue}>
                    {(movie.genres || [])
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