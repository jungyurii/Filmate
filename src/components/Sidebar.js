import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { House, Heart, Hourglass } from "lucide-react";
import { useWishlist } from "../hooks/useWishlist";
import { useTickets } from "../app/ticketsContext";
import styles from "./Sidebar.module.css";

function pickTitle(item) {
  return (
    item?.movieTitle ||
    item?.title ||
    item?.name ||
    item?.movie?.title ||
    item?.movie?.name ||
    "제목 없음"
  );
}

export default function Sidebar() {
  const { wishlist = [] } = useWishlist();
  const { tickets = [] } = useTickets();

  const previewItems = useMemo(() => {
    const booked = (tickets || []).map((t) => ({
      key: `ticket:${t.id || t.bookingCode || pickTitle(t)}`,
      title: pickTitle(t),
      meta: "예매",
    }));

    const wished = (wishlist || []).map((w) => ({
      key: `wish:${w.id || pickTitle(w)}`,
      title: pickTitle(w),
      meta: "찜",
    }));

    const merged = [...booked, ...wished];

    const seen = new Set();
    return merged.filter((x) => {
      const norm = `${x.title}:${x.meta}`;
      if (seen.has(norm)) return false;
      seen.add(norm);
      return true;
    }).slice(0, 3);
  }, [tickets, wishlist]);

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <NavLink to="/" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>
          <House size={18} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/wishlist" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>
          <Heart size={18} />
          <span>Favorites</span>
        </NavLink>

        <NavLink to="/coming-soon" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}>
          <Hourglass size={18} />
          <span>Coming soon</span>
        </NavLink>

      </nav>

      <div className={styles.bottomCard}>
        <div className={styles.bottomTitle}>My List</div>

        {!previewItems.length ? (
          <div className={styles.emptyText}>
            예매하거나 찜한 영화가 표시됩니다.
          </div>
        ) : (
          <div className={styles.previewList}>
            {previewItems.map((item) => (
              <div key={item.key} className={styles.previewItem}>
                <div className={styles.previewMeta}>{item.meta}</div>
                <div className={styles.previewTitle}>{item.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}