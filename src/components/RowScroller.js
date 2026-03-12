import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./RowScroller.module.css";

export default function RowScroller({
  children,
  visible = 6,
  step = 1,
  gap = 22,
}) {
  const viewportRef = useRef(null);
  const items = useMemo(() => React.Children.toArray(children), [children]);
  const total = items.length;

  const [cardW, setCardW] = useState(0);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const calc = () => {
      const w = el.clientWidth || 0;
      if (!w) return;
      const raw = (w - gap * (visible - 1)) / visible;
      const next = Math.max(136, Math.floor(raw));
      setCardW(next);
    };

    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible, gap]);

  const maxIndex = Math.max(0, total - visible);

  useEffect(() => {
    setIndex((prev) => Math.min(Math.max(prev, 0), maxIndex));
  }, [maxIndex]);

  const canPrev = index > 0;
  const canNext = index < maxIndex;

  const unit = (cardW || 0) + gap;
  const slideX = maxIndex === 0 ? 0 : -(index * unit);

  return (
    <div className={styles.wrap}>
      {canPrev && (
        <button
          type="button"
          className={`${styles.nav} ${styles.left}`}
          onClick={() => setIndex((v) => Math.max(0, v - step))}
          aria-label="이전"
        >
          ‹
        </button>
      )}

      <div className={styles.viewport} ref={viewportRef}>
        <div
          className={styles.track}
          style={{
            transform: `translateX(${slideX}px)`,
            gap: `${gap}px`,
            justifyContent: maxIndex === 0 ? "center" : "flex-start",
          }}
        >
          {items.map((node, i) => (
            <div
              key={node?.key ?? i}
              className={styles.item}
              style={{ width: cardW ? `${cardW}px` : undefined }}
            >
              {node}
            </div>
          ))}
        </div>
      </div>

      {canNext && (
        <button
          type="button"
          className={`${styles.nav} ${styles.right}`}
          onClick={() => setIndex((v) => Math.min(maxIndex, v + step))}
          aria-label="다음"
        >
          ›
        </button>
      )}
    </div>
  );
}
