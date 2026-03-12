import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const LS_KEY = "filmate:user:v1";

function normalizeIdSeed(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_가-힣-]/g, "");
}

function buildUser(nickname) {
  const nn = (nickname || "").trim() || "User";
  const seed = normalizeIdSeed(nn) || "user";
  return {
    id: `user:${seed}`,
    nickname: nn,
  };
}

function readInitialUser() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.nickname) return null;

    const hydrated = {
      id: parsed.id || buildUser(parsed.nickname).id,
      nickname: parsed.nickname,
    };

    // 예전 데이터 자동 보정
    localStorage.setItem(LS_KEY, JSON.stringify(hydrated));
    return hydrated;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readInitialUser());

  const login = (nickname) => {
    const u = buildUser(nickname);
    setUser(u);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(u));
    } catch {
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
    }
  };

  const value = useMemo(
    () => ({ user, isAuthed: !!user, login, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}