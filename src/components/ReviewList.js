import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RatingStars from "./RatingStars";
import Button from "./Button";
import { ThumbsUp, MessageSquareText, ArrowDownUp, Pencil } from "lucide-react";
import { useAuth } from "../app/authContext";
import styles from "./ReviewList.module.css";

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  return `${day}일 전`;
}

function posterFromMeta(meta) {
  if (!meta) return "";
  if (meta.posterUrl) return meta.posterUrl;
  const p = meta.posterPath || meta.poster || "";
  if (!p) return "";
  if (p.startsWith("http")) return p;
  return `https://image.tmdb.org/t/p/w342${p}`;
}

const EDIT_STAR_VALUES = [1, 2, 3, 4, 5];

function InlineStarEditor({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const displayValue = hovered || value || 0;

  return (
    <div
      className={styles.inlineStarWrap}
      onMouseLeave={() => setHovered(0)}
    >
      {EDIT_STAR_VALUES.map((star) => {
        const active = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            className={`${styles.inlineStarBtn} ${
              active ? styles.inlineStarBtnOn : ""
            }`}
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(star)}
          >
            ★
          </button>
        );
      })}
      <span className={styles.inlineStarScore}>
        {Number(value || 0).toFixed(1)}
      </span>
    </div>
  );
}

export default function ReviewList({
  reviews,
  itemMeta,
  onRemove,
  onToggleLike,
  onAddReply,
  onRemoveReply,
  onUpdateReview,
}) {
  const [sort, setSort] = useState("new");
  const [minRating, setMinRating] = useState(1);
  const [maxRating, setMaxRating] = useState(5);
  const [openId, setOpenId] = useState(null);
  const [replyTextByReview, setReplyTextByReview] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(5);

  const nav = useNavigate();
  const { user, isAuthed } = useAuth();
  const currentUserId = user?.id || "";

  const filtered = useMemo(() => {
    const minR = Number(minRating) || 1;
    const maxR = Number(maxRating) || 5;

    const base = (reviews || []).filter((r) => {
      const v = Number(r.rating || 0);
      return v >= minR && v <= maxR;
    });

    const sorted = [...base].sort((a, b) => {
      if (sort === "hot") {
        const la = Number(a.likes || 0);
        const lb = Number(b.likes || 0);
        if (lb !== la) return lb - la;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted;
  }, [reviews, sort, minRating, maxRating]);

  if (!reviews || !reviews.length) {
    return (
      <div className={styles.empty}>
        아직 리뷰가 없어요. 첫 리뷰 주인공을 해보세요 👀
      </div>
    );
  }

  const requireAuth = () => {
    if (isAuthed) return true;
    nav("/login");
    return false;
  };

  const getReplyText = (reviewId) => replyTextByReview[reviewId] || "";

  const setReplyText = (reviewId, value) => {
    setReplyTextByReview((prev) => ({
      ...prev,
      [reviewId]: value,
    }));
  };

  const clearReplyText = (reviewId) => {
    setReplyTextByReview((prev) => ({
      ...prev,
      [reviewId]: "",
    }));
  };

  const startEdit = (review) => {
    setEditingId(review.id);
    setEditText(review.content || "");
    setEditRating(Number(review.rating || 5));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditRating(5);
  };

  return (
    <div>
      <div className={styles.controls}>
        <div className={styles.ctrlGroup}>
          <span className={styles.ctrlLabel}>정렬</span>
          <button
            className={`${styles.pill} ${
              sort === "new" ? styles.pillOn : ""
            }`}
            onClick={() => setSort("new")}
            type="button"
          >
            <ArrowDownUp size={14} /> 최신
          </button>
          <button
            className={`${styles.pill} ${
              sort === "hot" ? styles.pillOn : ""
            }`}
            onClick={() => setSort("hot")}
            type="button"
          >
            <ThumbsUp size={14} /> 인기
          </button>
        </div>

        <div className={styles.ctrlGroup}>
          <span className={styles.ctrlLabel}>별점</span>
          <select
            className={styles.select}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
          >
            {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((n) => (
              <option key={n} value={n}>
                {n}↑
              </option>
            ))}
          </select>
          <span className={styles.ctrlSep}>~</span>
          <select
            className={styles.select}
            value={maxRating}
            onChange={(e) => setMaxRating(Number(e.target.value))}
          >
            {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((n) => (
              <option key={n} value={n}>
                {n}↓
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.list}>
        {filtered.map((r) => {
          const meta = r.itemMeta || itemMeta || null;
          const poster = posterFromMeta(meta);
          const title = meta?.title || "";
          const year = meta?.year || "";
          const type = meta?.type || "";
          const typeLabel =
            type === "movie" ? "영화" : type === "show" ? "쇼" : "시리즈";
          const isOpen = openId === r.id;
          const isEditing = editingId === r.id;
          const replyCount = (r.replies || []).length;
          const canDeleteReview =
            !!currentUserId && r.authorId === currentUserId;
          const replyText = getReplyText(r.id);

          return (
            <div key={r.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.profile}>
                  <div className={styles.avatar} aria-hidden="true">
                    {(r.author || "?").trim().slice(0, 1).toUpperCase()}
                  </div>
                  <div className={styles.profileMeta}>
                    <div className={styles.author}>{r.author}</div>
                    <div className={styles.subMeta}>
                      <RatingStars value={r.rating} size="sm" />
                      <span className={styles.time}>
                        {timeAgo(r.createdAt)}
                      </span>
                      {r.updatedAt ? (
                        <span className={styles.edited}>(수정됨)</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {canDeleteReview ? (
                  <div className={styles.ownerActions}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(r)}
                    >
                      <Pencil size={14} /> 수정
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove?.(r.id)}
                    >
                      삭제
                    </Button>
                  </div>
                ) : (
                  <div className={styles.ownerHint}>
                    작성자만 수정/삭제 가능
                  </div>
                )}
              </div>

              <div className={styles.body}>
                <div className={styles.metaLeft}>
                  <div className={styles.posterBox}>
                    {poster ? (
                      <img
                        className={styles.poster}
                        src={poster}
                        alt={title}
                      />
                    ) : (
                      <div className={styles.posterPh} />
                    )}
                  </div>
                  <div className={styles.itemText}>
                    <div className={styles.itemTitle}>
                      {title || "제목 없음"}
                    </div>
                    <div className={styles.itemSub}>
                      {typeLabel}
                      {year ? ` · ${year}` : ""}
                    </div>
                  </div>
                </div>

                <div className={styles.content}>
                  {isEditing ? (
                    <div className={styles.editBox}>
                      <InlineStarEditor
                        value={editRating}
                        onChange={setEditRating}
                      />
                      <textarea
                        className={styles.editTextarea}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div className={styles.editActions}>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                        >
                          취소
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={editText.trim().length < 3}
                          onClick={() => {
                            const text = editText.trim();
                            if (text.length < 3) return;
                            onUpdateReview?.(r.id, {
                              rating: editRating,
                              content: text,
                              contentHtml: "",
                            });
                            cancelEdit();
                          }}
                        >
                          저장
                        </Button>
                      </div>
                    </div>
                  ) : r.contentHtml ? (
                    <div
                      className={styles.contentHtml}
                      dangerouslySetInnerHTML={{ __html: r.contentHtml }}
                    />
                  ) : (
                    r.content
                  )}
                </div>
              </div>

              <div className={styles.cardBottom}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${
                    r.liked ? styles.actionOn : ""
                  }`}
                  onClick={() => {
                    if (!requireAuth()) return;
                    const ok = onToggleLike?.(r.id);
                    if (ok === false) nav("/login");
                  }}
                  aria-label="좋아요"
                  title="좋아요"
                >
                  <ThumbsUp size={16} />
                  <span>좋아요 {Number(r.likes || 0)}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.actionBtn} ${
                    isOpen ? styles.actionOn : ""
                  }`}
                  onClick={() => {
                    if (!requireAuth()) return;
                    setOpenId(isOpen ? null : r.id);
                    if (!isOpen) {
                      clearReplyText(r.id);
                    }
                  }}
                  aria-label="댓글"
                  title="댓글"
                >
                  <MessageSquareText size={16} />
                  <span>댓글 {replyCount}</span>
                </button>
              </div>

              {isOpen && (
                <div className={styles.replies}>
                  <div className={styles.replyInputRow}>
                    <input
                      className={styles.replyInput}
                      value={replyText}
                      onChange={(e) => setReplyText(r.id, e.target.value)}
                      placeholder="댓글을 입력해 주세요."
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={replyText.trim().length < 1}
                      onClick={() => {
                        if (!requireAuth()) return;

                        const text = replyText.trim();
                        if (!text) return;

                        const added = onAddReply?.(r.id, {
                          author: user.nickname,
                          content: text,
                        });

                        if (added) {
                          clearReplyText(r.id);
                        }
                      }}
                    >
                      Send
                    </Button>
                  </div>

                  <div className={styles.replyList}>
                    {(r.replies || []).map((rp) => {
                      const canDeleteReply =
                        !!currentUserId && rp.authorId === currentUserId;

                      return (
                        <div key={rp.id} className={styles.replyItem}>
                          <div className={styles.replyHead}>
                            <div className={styles.replyAuthor}>
                              {rp.author}
                            </div>
                            <div className={styles.replyTime}>
                              {timeAgo(rp.createdAt)}
                            </div>

                            {canDeleteReply ? (
                              <button
                                type="button"
                                className={styles.replyDelete}
                                onClick={() => {
                                  if (!requireAuth()) return;
                                  onRemoveReply?.(r.id, rp.id);
                                }}
                              >
                                삭제
                              </button>
                            ) : (
                              <span className={styles.replyOwnerHint}>
                                작성자만 삭제 가능
                              </span>
                            )}
                          </div>
                          <div className={styles.replyBody}>{rp.content}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}