import React, { useState } from "react";
import { useWishlist } from "../hooks/useWishlist";
import { Link } from "react-router-dom";
import styles from "./MovieCard.module.css";
import { getPoster } from "../lib/images";

export default function MovieCard({ movie, rank }) {
  const { isWished, toggleWish } = useWishlist();
  const [pop, setPop] = useState(false);
  const poster = getPoster(movie);
  const type = movie?._type === "show" ? "show" : ((movie?.media_type === "tv" || movie?._type === "tv") ? "tv" : "movie");
  const to = type === "show" ? `/shows/${movie.id}` : (type === "tv" ? `/series/${movie.id}` : `/movie/${movie.id}`);
  return (
    <Link to={to} className={styles.card}>
      <div className={styles.posterWrap}>
        {Number.isFinite(rank) && (
          <div className={styles.rankSquare} aria-label={`랭킹 ${rank}`}>{rank}</div>
        )}
        <button
          type="button"
          className={`${styles.wishBtn} ${isWished(movie.id, type) ? styles.wished : ""} ${pop ? styles.pop : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWish(movie, type);
            setPop(true);
            window.setTimeout(() => setPop(false), 450);
          }}
          aria-label={isWished(movie.id, type) ? "찜 해제" : "찜하기"}
          title={isWished(movie.id, type) ? "찜 해제" : "찜하기"}
        >
          <span className={styles.burst} aria-hidden="true" />
          ♥
        </button>
        <img className={styles.poster} src={poster} alt={`${movie.title} 포스터`} loading="lazy" />
        <div className={styles.posterGlow} aria-hidden="true" />
        {!Number.isFinite(rank) && (
          <div className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden="true" />
            <span>{movie.rating?.toFixed?.(1) ?? movie.rating}</span>
          </div>
        )}
      </div>

      <div className={styles.meta}>
        <div className={styles.title} title={movie.title}>{movie.title}</div>
                <div className={styles.sub}>
          <span>{movie.year || "----"}</span>
          <span className={styles.sep} aria-hidden="true">•</span>
          <span>
            {movie.runtime ? `${movie.runtime}분` : `평점 ${(Number(movie.rating || 0)).toFixed(1)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
