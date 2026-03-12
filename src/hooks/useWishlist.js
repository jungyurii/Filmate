import { useCallback, useEffect, useMemo, useState } from "react";
import { storage } from "../lib/storage";
import { useAuth } from "../app/authContext";

function makeKey(id, type = "movie") {
  const tid = Number(id);
  const t = type === "tv" ? "tv" : "movie";
  return `${t}:${tid}`;
}

function normalizeUserKey(user) {
  const raw = user?.id || user?.nickname || "guest";
  return String(raw).trim().toLowerCase().replace(/\s+/g, "_");
}

function storageKeyForUser(user) {
  return `filmate:wishlist:${normalizeUserKey(user)}`;
}

function normalizeItem(item) {
  if (!item) return null;

  // type/key 없으면 movie로 간주
  const type = item.type === "tv" ? "tv" : "movie";
  const id = Number(item.id);
  const key = item.key || makeKey(id, type);

  return {
    key,
    type,
    id,
    title: item.title ?? item.name ?? "",
    year: item.year ?? "",
    rating: item.rating ?? 0,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
  };
}

function loadByKey(storageKey) {
  const raw = storage.getJSON(storageKey, []);
  const norm = (raw || []).map(normalizeItem).filter(Boolean);

  // key 중복 제거
  const seen = new Set();
  const uniq = [];
  for (const it of norm) {
    if (seen.has(it.key)) continue;
    seen.add(it.key);
    uniq.push(it);
  }
  return uniq;
}

function saveByKey(storageKey, list) {
  storage.setJSON(storageKey, list);
}

function inferTypeFromMedia(item) {
  if (!item) return "movie";
  const t = item._type || item.media_type;
  return t === "tv" ? "tv" : "movie";
}

export function useWishlist() {
  const { user } = useAuth();
  const storageKey = useMemo(() => storageKeyForUser(user), [user]);

  const [list, setList] = useState(() => loadByKey(storageKey));

  // 로그인 유저 바뀌면 해당 유저의 찜 목록 다시 로드
  useEffect(() => {
    setList(loadByKey(storageKey));
  }, [storageKey]);

  const keys = useMemo(() => new Set((list || []).map((m) => m.key)), [list]);

  const isWished = useCallback(
    (id, type = "movie") => keys.has(makeKey(id, type)),
    [keys]
  );

  const toggleWish = useCallback(
    (item, forcedType) => {
      if (!item?.id) return;

      const type = forcedType || inferTypeFromMedia(item);
      const key = makeKey(item.id, type);

      // 공통 필드 정리
      const normalized = normalizeItem({
        key,
        type,
        id: Number(item.id),
        title: item.title ?? item.name,
        year: item.year,
        rating: item.rating,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
      });

      if (!normalized) return;

      setList((prev) => {
        const exists = prev.some((m) => m.key === key);
        const next = exists
          ? prev.filter((m) => m.key !== key)
          : [normalized, ...prev];

        saveByKey(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const clear = useCallback(() => {
    setList([]);
    saveByKey(storageKey, []);
  }, [storageKey]);

  const remove = useCallback(
    (id, type = "movie") => {
      const key = makeKey(id, type);
      setList((prev) => {
        const next = prev.filter((m) => m.key !== key);
        saveByKey(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  return { list, isWished, toggleWish, clear, remove };
}