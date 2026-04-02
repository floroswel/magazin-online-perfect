import { useState, useEffect } from "react";

function getTimeUntilMidnightRO(): { h: number; m: number; s: number } {
  // Romanian timezone: Europe/Bucharest
  const now = new Date();
  const roNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Bucharest" }));
  const midnight = new Date(roNow);
  midnight.setHours(24, 0, 0, 0);
  const diff = Math.max(0, midnight.getTime() - roNow.getTime());
  const totalSec = Math.floor(diff / 1000);
  return {
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function AnnouncementCountdown() {
  const [time, setTime] = useState(getTimeUntilMidnightRO);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeUntilMidnightRO()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="text-center py-2 text-sm font-medium tracking-wide"
      style={{ background: "#111", color: "#F5A623" }}
    >
      <span className="hidden sm:inline">🔥 Oferta expiră în </span>
      <span className="sm:hidden">🔥 </span>
      <span className="font-bold tabular-nums">
        {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
      </span>
      <span className="hidden sm:inline"> — Livrare GRATUITĂ peste 200 lei</span>
    </div>
  );
}
