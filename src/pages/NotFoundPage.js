import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import styles from "./NotFoundPage.module.css";

export default function NotFoundPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.title}>길을 잃었네요.</div>
        <div className={styles.sub}>여긴 아무것도 없어요. 홈으로 돌아가세요.</div>
        <Link to="/" className={styles.linkReset}>
          <Button>홈으로</Button>
        </Link>
      </div>
    </div>
  );
}
