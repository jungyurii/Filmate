import React from "react";
import styles from "./RatingStars.module.css";

export default function RatingStars({ value = 0, size = "md" }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5;

  const stars = Array.from({ length: 5 }).map((_, i) => {
    const idx = i + 1;
    let type = "empty";
    if (idx <= full) type = "full";
    else if (idx === full + 1 && half) type = "half";

    return (
      <span key={idx} className={`${styles.star} ${styles[type]} ${styles[size]}`} aria-hidden="true">
        ★
      </span>
    );
  });

  return (
    <span className={styles.wrap} aria-label={`별점 ${v} / 5`}>
      {stars}
    </span>
  );
}