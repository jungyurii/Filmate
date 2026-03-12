import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchMovieById, fetchNowPlayingIdSet } from "../api/contentApi";
import Button from "../components/Button";
import SeatPicker from "../components/SeatPicker";
import SectionHeader from "../components/SectionHeader";
import Stepper from "../components/Stepper";
import { THEATERS, buildShowtimesForMovie } from "../data/theaters";
import { uid } from "../lib/ids";
import { formatDateKR } from "../lib/format";
import { getPoster } from "../lib/images";
import { useTickets } from "../app/ticketsContext";
import styles from "./BookingPage.module.css";

function seatLabel(key) {
  const [r, c] = key.split("-").map(Number);
  if (!Number.isFinite(r) || !Number.isFinite(c)) return key;
  return `${String.fromCharCode(65 + r)}${c + 1}`;
}

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addTicket } = useTickets();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [allowed, setAllowed] = useState(null);

  const [theaterId, setTheaterId] = useState(THEATERS[0]?.id);
  const [date, setDate] = useState("");
  const [screen, setScreen] = useState("");
  const [time, setTime] = useState("");
  const [count, setCount] = useState(2);
  const [seats, setSeats] = useState([]);
  const [step, setStep] = useState(1);

  const VIP_ROWS = 2;
  const VIP_PRICE = 16000;
  const STD_PRICE = 12000;

  // 현재 상영작 여부 체크
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const nowSet = await fetchNowPlayingIdSet({ pages: 3 });
        if (!alive) return;
        setAllowed(nowSet.has(Number(id)));
      } catch (e) {
        if (!alive) return;
        // 상영작 체크 실패 시
        setAllowed(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // 영화 정보 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await fetchMovieById(id);
        if (!alive) return;
        setMovie(data);
      } catch (e) {
        if (!alive) return;
        setErr("영화 정보를 불러오지 못했어요.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const showtimes = useMemo(() => buildShowtimesForMovie(id), [id]);

  const currentTheater = useMemo(() => {
    return THEATERS.find((t) => t.id === theaterId) || THEATERS[0];
  }, [theaterId]);

  const theaterData = useMemo(() => {
    return showtimes.find((s) => s.theaterId === theaterId) || showtimes[0];
  }, [showtimes, theaterId]);

  const days = theaterData?.days || [];

  const pickedDay = useMemo(() => {
    return days.find((d) => d.date === date) || days[0];
  }, [days, date]);

  const sessionsForDay = pickedDay?.sessions || [];

  const pickedSession = useMemo(() => {
    return sessionsForDay.find((s) => s.screen === screen) || sessionsForDay[0];
  }, [sessionsForDay, screen]);

  const timesForScreen = pickedSession?.times || [];

  useEffect(() => {
    if (allowed !== true) return;
    if (loading) return;
    if (!days.length) return;
    if (!date) setDate(days[0].date);
  }, [allowed, loading, days, date]);

  useEffect(() => {
    if (allowed !== true) return;
    if (loading) return;
    if (!sessionsForDay.length) return;
    if (!screen) setScreen(sessionsForDay[0].screen);
  }, [allowed, loading, sessionsForDay, screen]);

  useEffect(() => {
    if (allowed !== true) return;
    if (loading) return;
    if (!timesForScreen.length) return;
    if (!time) setTime(timesForScreen[0]);
  }, [allowed, loading, timesForScreen, time]);

  // 좌석/가격 계산
  const seatMeta = (key) => {
    const [r] = key.split("-").map(Number);
    const vip = Number.isFinite(r) && r < VIP_ROWS;
    return vip ? VIP_PRICE : STD_PRICE;
  };

  const seatItems = useMemo(() => {
    return seats.map((k) => ({
      key: k,
      label: seatLabel(k),
      price: seatMeta(k),
      type: seatMeta(k) === VIP_PRICE ? "VIP" : "STD",
    }));
  }, [seats]);

  const total = useMemo(() => {
    return seatItems.reduce((a, b) => a + b.price, 0);
  }, [seatItems]);

  const canGoStep2 = Boolean(theaterId && date && screen && time);
  const canGoStep3 = seats.length === Number(count);

  const steps = [
    { key: "pick", title: "상영 선택" },
    { key: "seat", title: "좌석 선택" },
    { key: "pay", title: "결제/확정" },
  ];

  if (allowed === null) return <div className={styles.wrap}>확인 중…</div>;

  if (!allowed) {
    return (
      <div className={styles.wrap}>
        <div className={styles.err}>현재 상영작만 예매할 수 있어요.</div>
        <Link to={`/movie/${id}`}>영화 상세로 돌아가기</Link>
      </div>
    );
  }

  if (loading) return <div className={styles.wrap}>불러오는 중…</div>;
  if (err || !movie) return <div className={styles.wrap}>{err}</div>;

  return (
    <div className={styles.wrap}>
      <SectionHeader
        title="예매하기"
        right={
          <Link to={`/movie/${movie.id}`} className={styles.backLink}>
            ← 영화로 돌아가기
          </Link>
        }
      />

      <div className={styles.movieCard}>
        <img src={getPoster(movie)} alt="" className={styles.poster} />
        <div>
          <div className={styles.movieTitle}>{movie.title}</div>
          <div className={styles.movieSub}>
            {movie.year} • {movie.runtime || "-"}분
          </div>
        </div>
      </div>

      <Stepper
        steps={steps}
        current={step}
        onStep={(n) => {
          if (n === 2 && !canGoStep2) return;
          if (n === 3 && !canGoStep3) return;
          setStep(n);
        }}
      />

      <div className={styles.grid}>
        <div className={styles.panel}>
          {step === 1 && (
            <>
              <div className={styles.field}>
                <div className={styles.label}>극장</div>
                <div className={styles.pills}>
                  {THEATERS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`${styles.pill} ${
                        t.id === theaterId ? styles.pillActive : ""
                      }`}
                      onClick={() => {
                        setTheaterId(t.id);
                        setDate("");
                        setScreen("");
                        setTime("");
                        setSeats([]);
                      }}
                    >
                      <div className={styles.pillName}>{t.name}</div>
                      <div className={styles.pillArea}>{t.area}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>날짜</div>
                <div className={styles.days}>
                  {(days || []).map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      className={`${styles.day} ${
                        d.date === date ? styles.dayActive : ""
                      }`}
                      onClick={() => {
                        setDate(d.date);
                        setScreen("");
                        setTime("");
                        setSeats([]);
                      }}
                    >
                      {formatDateKR(d.date)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>상영관</div>
                <div className={styles.pills}>
                  {sessionsForDay.map((s) => (
                    <button
                      key={s.screen}
                      type="button"
                      className={`${styles.pill} ${
                        s.screen === screen ? styles.pillActive : ""
                      }`}
                      onClick={() => {
                        setScreen(s.screen);
                        setTime("");
                        setSeats([]);
                      }}
                    >
                      <div className={styles.pillName}>{s.screen}</div>
                      <div className={styles.pillArea}>
                        잔여 좌석은 좌석 선택에서 확인
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>시간</div>
                <div className={styles.days}>
                  {timesForScreen.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.day} ${
                        t === time ? styles.dayActive : ""
                      }`}
                      onClick={() => {
                        setTime(t);
                        setSeats([]);
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.stepActions}>
                <Button size="lg" disabled={!canGoStep2} onClick={() => setStep(2)}>
                  좌석 선택으로
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.field}>
                <div className={styles.label}>인원</div>
                <div className={styles.days}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.day} ${
                        n === count ? styles.dayActive : ""
                      }`}
                      onClick={() => {
                        setCount(n);
                        setSeats((prev) => prev.slice(0, n));
                      }}
                    >
                      {n}명
                    </button>
                  ))}
                </div>
                <div className={styles.sideHint}>
                  * {count}명 선택하면 정확히 {count}좌석을 골라야 다음 단계로 넘어가요.
                </div>
              </div>

              <SeatPicker
                value={seats}
                onChange={(next) => {
                  if ((next || []).length > Number(count)) return;
                  setSeats(next);
                }}
                movieSeed={Number(id)}
                vipRows={VIP_ROWS}
                vipPrice={VIP_PRICE}
                standardPrice={STD_PRICE}
              />

              <div className={styles.stepActions}>
                <Button variant="ghost" onClick={() => setStep(1)}>
                  이전
                </Button>
                <Button
                  size="lg"
                  disabled={!canGoStep3}
                  onClick={() => setStep(3)}
                >
                  결제/확정
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className={styles.confirmBox}>
                <div className={styles.confirmRow}>
                  <span>극장</span>
                  <b>{currentTheater?.name || "-"}</b>
                </div>
                <div className={styles.confirmRow}>
                  <span>날짜</span>
                  <b>{date ? formatDateKR(date) : "-"}</b>
                </div>
                <div className={styles.confirmRow}>
                  <span>상영관</span>
                  <b>{screen || "-"}</b>
                </div>
                <div className={styles.confirmRow}>
                  <span>시간</span>
                  <b>{time || "-"}</b>
                </div>
                <div className={styles.confirmRow}>
                  <span>좌석</span>
                  <b>{seatItems.map((s) => s.label).join(", ") || "-"}</b>
                </div>
              </div>

              <div className={styles.stepActions}>
                <Button variant="ghost" onClick={() => setStep(2)}>
                  이전
                </Button>
                <Button
                  size="lg"
                  disabled={!seats.length}
                  onClick={() => {
                    const bookingCode = String(Math.floor(Math.random() * 90000000) + 10000000);
                    const orderNo = `${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
                    const ticket = {
                      id: uid("tkt"),
                      movieId: movie.id,
                      movieTitle: movie.title,
                      moviePoster: getPoster(movie),
                      theaterId,
                      theaterName: currentTheater?.name,
                      area: currentTheater?.area,
                      date,
                      screen,
                      time,
                      seats: seatItems.map((s) => s.label),
                      seatItems,
                      total,
                      bookingCode,
                      orderNo,
                      issuedAt: new Date().toISOString(),
                    };
                    addTicket(ticket);
                    navigate("/tickets", { state: { justBooked: ticket.id } });
                  }}
                >
                  결제하기 ({total.toLocaleString()}원)
                </Button>
              </div>
            </>
          )}
        </div>

        <aside className={`${styles.sidebar} ${styles.summaryCard}`}>
          <div className={styles.sumTitle}>예매 요약</div>
          <div className={styles.sumRow}>
            <div className={styles.sumKey}>극장</div>
            <div className={styles.sumVal}>{currentTheater?.name || "-"}</div>
          </div>
          <div className={styles.sumRow}>
            <div className={styles.sumKey}>날짜</div>
            <div className={styles.sumVal}>{date ? formatDateKR(date) : "-"}</div>
          </div>
          <div className={styles.sumRow}>
            <div className={styles.sumKey}>상영관</div>
            <div className={styles.sumVal}>{screen || "-"}</div>
          </div>
          <div className={styles.sumRow}>
            <div className={styles.sumKey}>시간</div>
            <div className={styles.sumVal}>{time || "-"}</div>
          </div>
          <div className={styles.sumRow}>
            <div className={styles.sumKey}>좌석</div>
            <div className={styles.sumVal}>
              {seatItems.map((s) => s.label).join(", ") || "-"}
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.total}>
            <span>총액</span>
            <span>{total.toLocaleString()}원</span>
          </div>
          <div className={styles.note}>
            VIP(앞 {VIP_ROWS}줄) {VIP_PRICE.toLocaleString()}원 / 일반{" "}
            {STD_PRICE.toLocaleString()}원
          </div>
        </aside>
      </div>
    </div>
  );
}