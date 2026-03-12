export const THEATERS = [
  { id: "elite-gangnam", name: "ELIT큐 강남", area: "서울", screens: ["1관", "2관", "MX 4D"] },
  { id: "elite-hongdae", name: "ELIT큐 홍대", area: "서울", screens: ["1관", "2관", "Boutique Suite"] },
  { id: "elite-suwon", name: "ELIT큐 수원", area: "경기", screens: ["1관", "2관"] },
];

export function nextDays(count = 7) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    out.push(iso);
  }
  return out;
}

export function buildShowtimesForMovie(movieId) {
  const seed = [...String(movieId)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const baseTimes = ["10:20", "12:40", "15:10", "17:30", "20:00", "22:20"];
  const rotate = seed % baseTimes.length;

  const times = baseTimes.map((_, i) => baseTimes[(i + rotate) % baseTimes.length]);
  const days = nextDays(7);

  return THEATERS.map((t, idx) => ({
    theaterId: t.id,
    days: days.map((day) => ({
      date: day,
      sessions: t.screens.slice(0, 2 + (idx % 2)).map((screen, sidx) => ({
        screen,
        times: times.filter((_, ti) => (ti + sidx + idx) % 2 === 0),
      })),
    })),
  }));
}
