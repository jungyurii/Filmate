import { useEffect, useMemo, useState } from "react";
import { storage } from "../lib/storage";
import { uid } from "../lib/ids";
import { useAuth } from "../app/authContext";

function normalizeIdSeed(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_가-힣-]/g, "");
}

function normalizeUserId(user) {
  if (!user) return "";
  if (user.id) return user.id;
  if (user.nickname) return `user:${normalizeIdSeed(user.nickname)}`;
  return "";
}

function hydrateReview(r, currentUserId) {
  const likedUserIds = Array.isArray(r?.likedUserIds)
    ? r.likedUserIds.filter(Boolean)
    : [];

  const replies = Array.isArray(r?.replies)
    ? r.replies.map((rp) => ({
        id: rp.id || uid("rep"),
        author: (rp.author || "익명").toString(),
        authorId: (rp.authorId || "").toString(),
        content: (rp.content || "").toString(),
        createdAt: rp.createdAt || new Date().toISOString(),
      }))
    : [];

  return {
    id: r.id || uid("rev"),
    author: (r.author || "익명").toString(),
    authorId: (r.authorId || "").toString(),
    rating: Number(r.rating || 0) || 5,
    content: (r.content || "").toString(),
    contentHtml: (r.contentHtml || "").toString(),
    createdAt: r.createdAt || new Date().toISOString(),
    updatedAt: r.updatedAt || "",
    itemMeta: r.itemMeta || null,

    likedUserIds,
    likes: likedUserIds.length || Number(r.likes || 0) || 0,
    liked: currentUserId ? likedUserIds.includes(currentUserId) : false,

    replies,
  };
}

export function useReviews(contentKey) {
  const { user } = useAuth();
  const currentUserId = normalizeUserId(user);

  const key = useMemo(() => `filmate:reviews:v4:${contentKey}`, [contentKey]);

  const [reviews, setReviews] = useState(() => {
    const raw = storage.getJSON(key, null);
    const legacyV3 = raw ?? storage.getJSON(`filmate:reviews:v3:${contentKey}`, null);
    const legacyV2 = legacyV3 ?? storage.getJSON(`filmate:reviews:v2:${contentKey}`, null);
    const legacyV1 = legacyV2 ?? storage.getJSON(`filmate:reviews:v1:${contentKey}`, []);
    const base = Array.isArray(legacyV1) ? legacyV1 : [];
    return base.map((r) => hydrateReview(r, currentUserId));
  });

  useEffect(() => {
    setReviews((prev) => prev.map((r) => hydrateReview(r, currentUserId)));
  }, [currentUserId]);

  useEffect(() => {
    const toSave = (reviews || []).map((r) => ({
      id: r.id,
      author: r.author,
      authorId: r.authorId,
      rating: r.rating,
      content: r.content,
      contentHtml: r.contentHtml,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt || "",
      itemMeta: r.itemMeta || null,
      likedUserIds: Array.isArray(r.likedUserIds) ? r.likedUserIds : [],
      replies: (r.replies || []).map((rp) => ({
        id: rp.id,
        author: rp.author,
        authorId: rp.authorId,
        content: rp.content,
        createdAt: rp.createdAt,
      })),
    }));
    storage.setJSON(key, toSave);
  }, [key, reviews]);

  function addReview({ author, rating, content, contentHtml, itemMeta }) {
    const r = Math.round((Number(rating) || 5) * 2) / 2;
    const review = hydrateReview(
      {
        id: uid("rev"),
        author: (author || user?.nickname || "익명").trim().slice(0, 20) || "익명",
        authorId: currentUserId,
        rating: Math.max(1, Math.min(5, r)),
        content: (content || "").trim(),
        contentHtml: (contentHtml || "").trim(),
        createdAt: new Date().toISOString(),
        updatedAt: "",
        likedUserIds: [],
        itemMeta: itemMeta || null,
        replies: [],
      },
      currentUserId
    );

    setReviews((prev) => [review, ...prev]);
    return review;
  }

  function updateReview(reviewId, { rating, content, contentHtml }) {
    const nextRating = Math.round((Number(rating) || 5) * 2) / 2;

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;
        if (r.authorId !== currentUserId) return r;

        return hydrateReview(
          {
            ...r,
            rating: Math.max(1, Math.min(5, nextRating)),
            content: (content || "").trim(),
            contentHtml: (contentHtml || "").trim(),
            updatedAt: new Date().toISOString(),
          },
          currentUserId
        );
      })
    );
  }

  function removeReview(reviewId) {
    setReviews((prev) =>
      prev.filter((r) => !(r.id === reviewId && r.authorId === currentUserId))
    );
  }

  function toggleLike(reviewId) {
    if (!currentUserId) return false;

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;

        const likedUserIds = Array.isArray(r.likedUserIds) ? [...r.likedUserIds] : [];
        const exists = likedUserIds.includes(currentUserId);

        const nextLikedUserIds = exists
          ? likedUserIds.filter((id) => id !== currentUserId)
          : [...likedUserIds, currentUserId];

        return hydrateReview(
          {
            ...r,
            likedUserIds: nextLikedUserIds,
          },
          currentUserId
        );
      })
    );

    return true;
  }

  function addReply(reviewId, { author, content }) {
    if (!currentUserId) return null;

    const text = (content || "").trim();
    if (!text) return null;

    const reply = {
      id: uid("rep"),
      author: (author || user?.nickname || "익명").trim().slice(0, 20) || "익명",
      authorId: currentUserId,
      content: text,
      createdAt: new Date().toISOString(),
    };

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              replies: [...(r.replies || []), reply],
            }
          : r
      )
    );

    return reply;
  }

  function removeReply(reviewId, replyId) {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;

        return {
          ...r,
          replies: (r.replies || []).filter(
            (rp) => !(rp.id === replyId && rp.authorId === currentUserId)
          ),
        };
      })
    );
  }

  const summary = useMemo(() => {
    if (!reviews.length) return { count: 0, avg: 0 };
    const sum = reviews.reduce((a, r) => a + Number(r.rating || 0), 0);
    return {
      count: reviews.length,
      avg: Math.round((sum / reviews.length) * 10) / 10,
    };
  }, [reviews]);

  return {
    reviews,
    addReview,
    updateReview,
    removeReview,
    toggleLike,
    addReply,
    removeReply,
    summary,
  };
}