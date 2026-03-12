import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { storage } from "../lib/storage";
import { useAuth } from "./authContext";

const TicketsContext = createContext(null);

function normalizeUserKey(user) {
  const raw = user?.id || user?.nickname || "guest";
  return String(raw).trim().toLowerCase().replace(/\s+/g, "_");
}

function storageKeyForUser(user) {
  return `filmate:tickets:v1:${normalizeUserKey(user)}`;
}

export function TicketsProvider({ children }) {
  const { user } = useAuth();
  const storageKey = useMemo(() => storageKeyForUser(user), [user]);

  const [tickets, setTickets] = useState(() => storage.getJSON(storageKey, []));

  // 로그인 유저 바뀌면 해당 유저 티켓 다시 로드
  useEffect(() => {
    setTickets(storage.getJSON(storageKey, []));
  }, [storageKey]);

  useEffect(() => {
    storage.setJSON(storageKey, tickets);
  }, [storageKey, tickets]);

  const value = useMemo(
    () => ({
      tickets,
      addTicket: (ticket) => setTickets((prev) => [ticket, ...prev]),
      removeTicket: (ticketId) =>
        setTickets((prev) => prev.filter((t) => t.id !== ticketId)),
      clearTickets: () => setTickets([]),
    }),
    [tickets]
  );

  return (
    <TicketsContext.Provider value={value}>
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const ctx = useContext(TicketsContext);
  if (!ctx) throw new Error("useTickets must be used within TicketsProvider");
  return ctx;
}