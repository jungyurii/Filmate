import React from "react";
import styles from "./SectionHeader.module.css";

export default function SectionHeader({ title, subtitle, right }) {
  return (
    <div className={styles.wrap}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        {subtitle ? <div className={styles.sub}>{subtitle}</div> : null}
      </div>
      <div className={styles.right}>{right}</div>
    </div>
  );
}
