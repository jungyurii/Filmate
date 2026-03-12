import React from "react";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <div className={styles.logo}>Filmate</div>
          <div className={styles.meta}>영화 정보/예매 데모 프로젝트 • React</div>
        </div>
        <div className={styles.links}>
          <a href="#!" onClick={(e) => e.preventDefault()}>문의하기</a>
          <a href="#!" onClick={(e) => e.preventDefault()}>자주 묻는 질문</a>
          <a href="#!" onClick={(e) => e.preventDefault()}>이용약관</a>
        </div>
      </div>
    </footer>
  );
}
