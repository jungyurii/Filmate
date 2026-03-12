import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchMovies } from "../api/contentApi";
import { normalizeTitle } from "../lib/format";
import { getPoster } from "../lib/images";
import styles from "../components/SearchBar.module.css";

export default function SearchBar({ placeholder = "영화, 시리즈, 쇼 검색…" }) {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(-1);

  const boxRef = useRef(null);

  const normQ = useMemo(() => normalizeTitle(q), [q]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) {
        setOpen(false);
        setActive(-1);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const query = q.trim();
      if (!query) {
        setItems([]);
        setActive(-1);
        return;
      }
      try {
        const res = await searchMovies(query, { page: 1 });
        if (!alive) return;
        setItems(res.slice(0, 8));
        setActive(-1);
      } catch {
        if (!alive) return;
        setItems([]);
        setActive(-1);
      }
    }, 180);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  const goSearch = () => {
    const query = q.trim();
    if (!query) return;
    setOpen(false);
    setActive(-1);
    nav(`/search?q=${encodeURIComponent(query)}`);
  };

  const goMovie = (movieId) => {
    setOpen(false);
    setActive(-1);
    nav(`/movie/${movieId}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && items[active]) goMovie(items[active].id);
      else goSearch();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((v) => Math.min((items?.length || 0) - 1, v + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((v) => Math.max(-1, v - 1));
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  function renderTitle(title) {
    const raw = title || "";
    const nRaw = normalizeTitle(raw);
    if (!normQ || !nRaw.includes(normQ)) return raw;
    return <strong>{raw}</strong>;
  }

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div className={styles.wrap}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={styles.input}
          aria-label="영화 검색"
        />
        <button
          type="button"
          className={styles.searchBtn}
          onClick={goSearch}
          aria-label="검색"
        >
          <i className="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>

      {open && q.trim() && (
        <div className={styles.dropdown} role="listbox" aria-label="검색 자동완성">
          {items.length === 0 ? (
            <div className={styles.empty}>검색 결과가 없어요.</div>
          ) : (
            items.map((m, i) => (
              <button
                key={m.id}
                type="button"
                className={`${styles.item} ${i === active ? styles.itemActive : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => goMovie(m.id)}
              >
                <img className={styles.thumb} src={getPoster(m)} alt="" loading="lazy" />
                <div className={styles.meta}>
                  <div className={styles.title}>{renderTitle(m.title)}</div>
                  <div className={styles.sub}>
                    {m.year ? `${m.year} · ` : ""}평점 {Number(m.rating || 0).toFixed(1)}
                  </div>
                </div>
              </button>
            ))
          )}

          <button type="button" className={styles.searchAll} onClick={goSearch}>
            “{q.trim()}” 검색 결과 보기 →
          </button>
        </div>
      )}
    </div>
  );
}
