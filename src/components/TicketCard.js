import React, { useMemo } from "react";
import Button from "./Button";
import styles from "./TicketCard.module.css";

function safeText(s) {
  return String(s || "").replace(/[\u0000-\u001f]/g, " ");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function svgToPngDataUrl(svgText, width, height) {
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");

    ctx.fillStyle = "#0b0b0f";
    ctx.fillRect(0, 0, width, height);

    const x = 0;
    const y = 0;
    ctx.drawImage(img, x, y, width, height);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function TicketCard({ ticket, onRemove, highlight = false }) {
  const seatLine = useMemo(() => {
    const seats = Array.isArray(ticket.seats) ? ticket.seats : [];
    return seats.join(", ");
  }, [ticket.seats]);

  const issuedAt = useMemo(() => {
    const d = ticket.issuedAt ? new Date(ticket.issuedAt) : new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }, [ticket.issuedAt]);

  const svgMarkup = useMemo(() => {
    const w = 860;
    const h = 460;
    const title = safeText(ticket.movieTitle);
    const meta1 = safeText(`${ticket.theaterName || "-"} (${ticket.area || "-"})`);
    const meta2 = safeText(`${ticket.date || "-"} • ${ticket.time || "-"} • ${ticket.screen || "-"}`);
    const code = safeText(ticket.bookingCode || ticket.id || "-");
    const order = safeText(ticket.orderNo || "-");
    const seats = safeText(seatLine || "-");
    const total = Number(ticket.total || 0).toLocaleString();

    const bars = new Array(90).fill(0).map((_, i) => {
      const bw = i % 3 === 0 ? 3 : 2;
      const bh = i % 7 === 0 ? 78 : 62;
      const x = 64 + i * 7;
      const y = 348;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="1" fill="rgba(0,0,0,.78)" />`;
    }).join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgb(207,177,255)" />
      <stop offset="1" stop-color="rgb(130,70,255)" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="rgba(0,0,0,.55)" />
    </filter>
  </defs>

  <!-- ticket body -->
  <g filter="url(#shadow)">
    <rect x="30" y="24" width="800" height="412" rx="26" fill="rgba(255,255,255,.94)" />
    <!-- punch notches -->
    <circle cx="30" cy="230" r="18" fill="#0b0b0f" />
    <circle cx="830" cy="230" r="18" fill="#0b0b0f" />
    <!-- header strip -->
    <rect x="30" y="24" width="800" height="74" rx="26" fill="url(#g)" />
    <rect x="30" y="78" width="800" height="20" fill="url(#g)" />
  </g>

  <text x="64" y="68" font-family="ui-sans-serif,system-ui" font-weight="900" font-size="22" fill="rgba(11,11,15,.92)">ENJOY YOUR MOVIE!</text>

  <g>
    <text x="64" y="138" font-family="ui-sans-serif,system-ui" font-weight="900" font-size="30" fill="rgba(11,11,15,.92)">${title}</text>
    <text x="64" y="170" font-family="ui-sans-serif,system-ui" font-weight="700" font-size="16" fill="rgba(11,11,15,.78)">${meta1}</text>
    <text x="64" y="196" font-family="ui-sans-serif,system-ui" font-weight="700" font-size="16" fill="rgba(11,11,15,.78)">${meta2}</text>

    <text x="64" y="246" font-family="ui-sans-serif,system-ui" font-weight="900" font-size="16" fill="rgba(11,11,15,.80)">Tickets</text>
    <text x="64" y="272" font-family="ui-sans-serif,system-ui" font-weight="800" font-size="18" fill="rgba(11,11,15,.92)">${seats}</text>

    <text x="64" y="312" font-family="ui-sans-serif,system-ui" font-weight="900" font-size="15" fill="rgba(11,11,15,.80)">Booking Code</text>
    <text x="180" y="312" font-family="ui-sans-serif,system-ui" font-weight="900" font-size="15" fill="rgba(11,11,15,.92)">${code}</text>

    <text x="64" y="336" font-family="ui-sans-serif,system-ui" font-weight="900" font-size="15" fill="rgba(11,11,15,.80)">Order No</text>
    <text x="180" y="336" font-family="ui-sans-serif,system-ui" font-weight="900" font-size="15" fill="rgba(11,11,15,.92)">${order}</text>

    <text x="650" y="312" text-anchor="end" font-family="ui-sans-serif,system-ui" font-weight="900" font-size="15" fill="rgba(11,11,15,.80)">Issued</text>
    <text x="790" y="312" text-anchor="end" font-family="ui-sans-serif,system-ui" font-weight="900" font-size="15" fill="rgba(11,11,15,.92)">${issuedAt}</text>

    <text x="650" y="336" text-anchor="end" font-family="ui-sans-serif,system-ui" font-weight="900" font-size="15" fill="rgba(11,11,15,.80)">Total</text>
    <text x="790" y="336" text-anchor="end" font-family="ui-sans-serif,system-ui" font-weight="950" font-size="18" fill="rgba(11,11,15,.92)">${total}원</text>
  </g>

  <!-- barcode area -->
  <g>
    <rect x="64" y="340" width="732" height="110" rx="12" fill="rgba(0,0,0,.06)" />
    ${bars}
  </g>
</svg>`;
  }, [ticket, seatLine, issuedAt]);


  const onDownloadPng = async () => {
    const filename = `ticket_${ticket.bookingCode || ticket.id}.png`;
    const pngUrl = await svgToPngDataUrl(svgMarkup, 860, 460);
    const res = await fetch(pngUrl);
    const blob = await res.blob();
    downloadBlob(blob, filename);
  };

  return (
    <div className={`${styles.card} ${highlight ? styles.highlight : ""}`}>
      <div className={styles.svgWrap}>
        <div
          className={styles.svg}
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      </div>

      <div className={styles.actions}>
        <Button size="sm" onClick={onDownloadPng}>PNG 저장</Button>
        <Button size="sm" variant="ghost" onClick={onRemove}>삭제</Button>
      </div>
    </div>
  );
}
