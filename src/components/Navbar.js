import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import SearchBar from "./SearchBar";

export default function Navbar({ translucent = false }) {
  const navigate = useNavigate();

  return (
    <header className={`${styles.header} ${translucent ? styles.translucent : ""}`}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link to="/" className={styles.brand} aria-label="Filmate 홈">
            <span className={styles.brandMark} />
            <span className={styles.brandText}>Filmate</span>
          </Link>

          <nav className={styles.nav}>
            <NavLink to="/" className={({ isActive }) => (isActive ? styles.active : styles.link)}>
              홈
            </NavLink>
            <button className={styles.linkBtn} onClick={() => navigate("/", { state: { scrollTo: "now" } })}>
              영화
            </button>
            <NavLink to="/tickets" className={({ isActive }) => (isActive ? styles.active : styles.link)}>
              예매내역
            </NavLink>
            <NavLink to="/wishlist" className={({ isActive }) => (isActive ? styles.active : styles.link)}>
              찜
            </NavLink>
          </nav>
        </div>

        <div className={styles.right}>
          <SearchBar />
          <button className={styles.iconBtn} title="계정" aria-label="계정">
            <span className={styles.avatar} />
          </button>
        </div>
      </div>
    </header>
  );
}
