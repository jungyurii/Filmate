import React, { useMemo } from "react";
import styles from "./SeatPicker.module.css";

function buildSeats(rows = 10, cols = 12, seed = 0) {
  const reserved = new Set();
  for (let i = 0; i < Math.floor(rows * cols * 0.16); i++) {
    const r = (seed * 17 + i * 13) % rows;
    const c = (seed * 23 + i * 7) % cols;
    reserved.add(`${r}-${c}`);
  }
  return { rows, cols, reserved };
}

export default function SeatPicker({
  value = [],
  onChange,
  movieSeed = 1,
  vipRows = 2,
  vipPrice = 16000,
  standardPrice = 12000,
}) {
  const selected = useMemo(() => new Set(value), [value]);
  const { rows, cols, reserved } = useMemo(() => buildSeats(10, 12, movieSeed), [movieSeed]);

  const toggle = (r, c) => {
    const key = `${r}-${c}`;
    if (reserved.has(key)) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange?.(Array.from(next));
  };

  const label = (r, c) => `${String.fromCharCode(65 + r)}${c + 1}`;
  const seatType = (r) => (r < vipRows ? "VIP" : "일반");

  return (
    <div className={styles.wrap}>
      <div className={styles.screen}>SCREEN</div>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const key = `${r}-${c}`;
            const isReserved = reserved.has(key);
            const isSelected = selected.has(key);
            const isVip = r < vipRows;
            return (
              <button
                key={key}
                className={`${styles.seat} ${isVip ? styles.vip : ""} ${isReserved ? styles.reserved : ""} ${isSelected ? styles.selected : ""}`}
                onClick={() => toggle(r, c)}
                type="button"
                aria-label={`좌석 ${label(r, c)} ${seatType(r)} ${isReserved ? "예약불가" : isSelected ? "선택됨" : "선택 가능"}`}
              >
                {label(r, c)}
              </button>
            );
          })
        )}
      </div>

      <div className={styles.legend}>
        <span><i className={`${styles.dot} ${styles.dotVip}`} /> VIP {vipPrice.toLocaleString()}원</span>
        <span><i className={`${styles.dot} ${styles.dotAvail}`} /> 선택 가능</span>
        <span><i className={`${styles.dot} ${styles.dotSel}`} /> 선택</span>
        <span><i className={`${styles.dot} ${styles.dotRes}`} /> 예약불가</span>
        <span className={styles.hint}>* 앞쪽 {vipRows}줄 = VIP</span>
      </div>
    </div>
  );
}
