import React from "react";
import SectionHeader from "../components/SectionHeader";
import MovieCard from "../components/MovieCard";
import Button from "../components/Button";
import { useWishlist } from "../hooks/useWishlist";
import styles from "./WishlistPage.module.css";

export default function WishlistPage() {
  const { list, clear } = useWishlist();

  return (
    <div className={styles.wrap}>
      <SectionHeader
        title="찜한 콘텐츠"
        right={
          <Button variant="ghost" onClick={clear} disabled={!list.length}>
            전체삭제
          </Button>
        }
      />

      {!list.length ? (
        <div className={styles.empty}>아직 찜한 콘텐츠가 없어요. 마음에 들면 “찜하기” 눌러보세요 🖤</div>
      ) : (
        <div className={styles.grid}>
          {list.map((m) => (
            <MovieCard key={m.key} movie={{ ...m, _type: m.type }} />
          ))}
        </div>
      )}
    </div>
  );
}
