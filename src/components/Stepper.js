import React from "react";
import styles from "./Stepper.module.css";

export default function Stepper({
  steps = [],
  current = 1,
  onStep,
}) {
  const pct = steps.length ? ((current - 1) / (steps.length - 1)) * 100 : 0;

  return (
    <div className={styles.wrap} aria-label="예매 진행 단계">
      <div className={styles.bar} aria-hidden="true">
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.row}>
        {steps.map((s, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <button
              key={s.key || s.title || n}
              type="button"
              className={`${styles.step} ${done ? styles.done : ""} ${active ? styles.active : ""}`}
              onClick={() => onStep?.(n)}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.title}>{s.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
