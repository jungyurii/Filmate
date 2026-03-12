import React, { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTickets } from "../app/ticketsContext";
import Button from "../components/Button";
import SectionHeader from "../components/SectionHeader";
import TicketCard from "../components/TicketCard";
import styles from "./TicketsPage.module.css";

export default function TicketsPage() {
  const { tickets, removeTicket, clearTickets } = useTickets();
  const location = useLocation();
  const justBookedId = location?.state?.justBooked;

  useEffect(() => {
    if (!justBookedId) return;
    window.history.replaceState({}, document.title);
  }, [justBookedId]);

  const grouped = useMemo(() => tickets, [tickets]);

  return (
    <div className={styles.wrap}>
      <SectionHeader
        title="예매내역"
        subtitle="완료한 예매를 한눈에 확인할 수 있어요."
        right={
          tickets.length ? (
            <Button variant="ghost" size="sm" onClick={clearTickets}>전체 삭제</Button>
          ) : null
        }
      />

      {!tickets.length ? (
        <div className={styles.empty}>
          아직 예매한 게 없어요. <Link to="/" className={styles.link}>홈</Link>에서 골라봐.
        </div>
      ) : null}

      <div className={styles.list}>
        {grouped.map((t) => (
          <div key={t.id}>
            <TicketCard
              ticket={t}
              highlight={t.id === justBookedId}
              onRemove={() => removeTicket(t.id)}
            />
            <div className={styles.belowLinks}>
              <Link className={styles.linkReset} to={`/movie/${t.movieId}`}>
                <Button size="sm" variant="ghost">상세 보기</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
