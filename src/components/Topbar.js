import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { fetchTvGenres } from "../api/contentApi";
import styles from "./Topbar.module.css";
import { useAuth } from "../app/authContext";

function MenuItem({ children, onClick }) {
  return (
    <button type="button" className={styles.menuItem} onClick={onClick}>
      {children}
    </button>
  );
}

function Divider() {
  return <div className={styles.menuDivider} aria-hidden="true" />;
}

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthed, logout } = useAuth();

  const [open, setOpen] = useState(null); // 'movies'|'series'|'shows'|null
  const [tvGenres, setTvGenres] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const gs = await fetchTvGenres();
        if (!alive) return;
        setTvGenres(Array.isArray(gs) ? gs : []);
      } catch {
        if (!alive) return;
        setTvGenres([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const title = useMemo(() => {
    const p = location.pathname;
    if (p === "/") return "Home";
    if (p.startsWith("/movie/")) return "Details";
    if (p.startsWith("/series/")) return "Series";
    if (p === "/series") return "Series";
    if (p === "/shows") return "Shows";
    if (p.startsWith("/book/")) return "Booking";
    if (p === "/tickets") return "Tickets";
    if (p === "/wishlist") return "Favorites";
    if (p === "/coming-soon") return "Coming soon";
    if (p === "/search") return "Search";
    return "Filmate";
  }, [location.pathname]);

  const go = (path) => {
    setOpen(null);
    navigate(path);
  };

  const goSeries = (qs) => {
    setOpen(null);
    navigate(`/series${qs ? `?${qs}` : ""}`);
  };

  const goShows = (qs) => {
    setOpen(null);
    navigate(`/shows${qs ? `?${qs}` : ""}`);
  };

  return (
    <header className={styles.topbar} onMouseLeave={() => setOpen(null)}>
      <div className={styles.left}>
        <div className={styles.pageTitle}>{title}</div>

        <div className={styles.menuPill}>
          <div className={styles.menuRoot}>
            <button
              type="button"
              className={
                open === "movies"
                  ? `${styles.menuBtn} ${styles.menuBtnActive}`
                  : styles.menuBtn
              }
              onMouseEnter={() => setOpen("movies")}
              onFocus={() => setOpen("movies")}
            >
              Movies <span className={styles.chev} aria-hidden="true">▾</span>
            </button>
            {open === "movies" && (
              <div className={styles.menuPanel} role="menu" aria-label="Movies menu">
                <MenuItem onClick={() => go("/")}>홈</MenuItem>
                <MenuItem onClick={() => go("/coming-soon")}>개봉예정</MenuItem>
                <MenuItem onClick={() => go("/wishlist")}>찜한 리스트</MenuItem>
                <Divider />
                <div className={styles.menuHint}>박스오피스와 개봉예정작을 빠르게 둘러보세요.</div>
              </div>
            )}
          </div>

          <div className={styles.menuRoot}>
            <button
              type="button"
              className={
                open === "series"
                  ? `${styles.menuBtn} ${styles.menuBtnActive}`
                  : styles.menuBtn
              }
              onMouseEnter={() => setOpen("series")}
              onFocus={() => setOpen("series")}
            >
              Series <span className={styles.chev} aria-hidden="true">▾</span>
            </button>
            {open === "series" && (
              <div className={styles.menuPanelWide} role="menu" aria-label="Series menu">
                <div className={styles.menuCol}>
                  <div className={styles.menuTitle}>추천</div>
                  <MenuItem onClick={() => goSeries("sort=onair")}>새로 올라온</MenuItem>
                  <MenuItem onClick={() => goSeries("genre=18")}>감동/드라마</MenuItem>
                  <MenuItem onClick={() => goSeries("genre=16&country=JP")}>일본 애니</MenuItem>
                  <MenuItem onClick={() => goSeries("country=CN")}>중국 본토</MenuItem>
                </div>

                <div className={styles.menuCol}>
                  <div className={styles.menuTitle}>장르</div>
                  <div className={styles.genreGrid}>
                    {(tvGenres || []).slice(0, 14).map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className={styles.genreBtn}
                        onClick={() => goSeries(`genre=${g.id}`)}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.menuRoot}>
            <button
              type="button"
              className={
                open === "shows"
                  ? `${styles.menuBtn} ${styles.menuBtnActive}`
                  : styles.menuBtn
              }
              onMouseEnter={() => setOpen("shows")}
              onFocus={() => setOpen("shows")}
            >
              Shows <span className={styles.chev} aria-hidden="true">▾</span>
            </button>
            {open === "shows" && (
              <div className={styles.menuPanel} role="menu" aria-label="Shows menu">
                <MenuItem onClick={() => goShows("")}>전체 쇼</MenuItem>
                <MenuItem onClick={() => goShows("genre=35")}>코미디</MenuItem>
                <MenuItem onClick={() => goShows("genre=80")}>범죄</MenuItem>
                <MenuItem onClick={() => goShows("genre=10765")}>SF/판타지</MenuItem>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.center}>
        <SearchBar placeholder="시리즈, 쇼 검색…" />
      </div>

      <div className={styles.right}>
        {isAuthed ? (
          <button
            type="button"
            className={styles.authBtn}
            onClick={() => {
              logout();
              navigate("/");
            }}
            title="로그아웃"
          >
            <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
            <span>Log out</span>
          </button>
        ) : (
          <Link to="/login" className={styles.authBtn} title="로그인">
            <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
            <span>Log in</span>
          </Link>
        )}

        <button
          className={styles.user}
          type="button"
          onClick={() => (isAuthed ? navigate("/wishlist") : navigate("/login"))}
          title="프로필"
        >
          <span className={styles.avatar} aria-hidden="true" />
          <span className={styles.userText}>
            <span className={styles.userName}>{isAuthed ? user.nickname : "Guest"}</span>
            <span className={styles.userPlan}>Premium</span>
          </span>
        </button>
      </div>
    </header>
  );
}