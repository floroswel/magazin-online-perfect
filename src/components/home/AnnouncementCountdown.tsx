import { useState, useEffect } from "react";
import { useEditableContent } from "@/hooks/useEditableContent";

function getTimeUntilMidnightRO(): { h: number; m: number; s: number } {
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
  const { announcement } = useEditableContent();

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeUntilMidnightRO()), 1000);
    return () => clearInterval(id);
  }, []);

  const desktopText = (announcement.text_desktop || "").replace("{threshold}", String(announcement.threshold || 200));
  const mobileText = (announcement.text_mobile || "").replace("{threshold}", String(announcement.threshold || 200));

  // Hide bar if disabled or both texts are empty
  if (announcement.enabled === false) return null;
  if (!desktopText.trim() && !mobileText.trim()) return null;

  const bgColor = announcement.bg_color || undefined;
  const textColor = announcement.text_color || undefined;
  const isMarquee = !!announcement.marquee;
  const isMarqueeMobile = !!announcement.marquee_mobile;
  const showCountdown = announcement.show_countdown !== false;

  const timerBlock = showCountdown ? (
    <span className="font-bold tabular-nums">
      {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
    </span>
  ) : null;

  const content = (
    <>
      <span className="hidden sm:inline">{desktopText}</span>
      <span className="sm:hidden">{mobileText}</span>
      {timerBlock}
    </>
  );

  const marqueeBlock = (
    <div className="relative flex overflow-hidden">
      <div className="animate-marquee-announcement flex items-center whitespace-nowrap gap-16 min-w-full justify-center shrink-0">
        {content}
        <span className="opacity-40 mx-4">✦</span>
        {content}
      </div>
      <div className="animate-marquee-announcement flex items-center whitespace-nowrap gap-16 min-w-full justify-center shrink-0" aria-hidden>
        {content}
        <span className="opacity-40 mx-4">✦</span>
        {content}
      </div>
    </div>
  );

  const staticBlock = content;

  return (
    <div
      className="text-center py-2 text-sm font-medium tracking-wide bg-primary text-primary-foreground overflow-hidden"
      style={{
        ...(bgColor ? { backgroundColor: bgColor } : {}),
        ...(textColor ? { color: textColor } : {}),
      }}
    >
      {/* Desktop */}
      <div className="hidden sm:block">
        {isMarquee ? marqueeBlock : staticBlock}
      </div>
      {/* Mobile */}
      <div className="sm:hidden">
        {isMarqueeMobile ? marqueeBlock : staticBlock}
      </div>
    </div>
  );
}
