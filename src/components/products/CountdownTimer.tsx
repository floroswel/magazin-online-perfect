import { useState, useEffect } from "react";

interface Props {
  endsAt: string;
  className?: string;
}

export default function CountdownTimer({ endsAt, className = "" }: Props) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const diff = end - now;
      if (diff <= 0) { setTimeLeft("Expirat"); return; }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const parts: string[] = [];
      if (d > 0) parts.push(`${d}z`);
      if (h > 0) parts.push(`${h}h`);
      parts.push(`${m}min`);
      setTimeLeft(parts.join(" "));
    };
    calc();
    const interval = setInterval(calc, 60_000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!timeLeft || timeLeft === "Expirat") return null;

  return (
    <span className={`text-xs font-medium text-destructive ${className}`}>
      ⏳ Expiră în {timeLeft}
    </span>
  );
}
