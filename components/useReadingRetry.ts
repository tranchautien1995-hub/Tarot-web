"use client";

import { useEffect, useRef, useState } from "react";

export function useReadingRetry() {
  const [retrySeconds, setRetrySeconds] = useState(0);
  const deadline = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryBlocked = () => Date.now() < deadline.current;
  const startRetry = () => {
    if (timer.current) clearInterval(timer.current);
    deadline.current = Date.now() + 10_000;
    setRetrySeconds(10);
    timer.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRetrySeconds(remaining);
      if (!remaining && timer.current) { clearInterval(timer.current); timer.current = null; }
    }, 1000);
  };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const retryMessage = retrySeconds > 0
    ? `Hệ thống đang quá tải, vui lòng thử lại sau ${retrySeconds} giây.`
    : "Hệ thống đang quá tải. Vui lòng thử lại.";
  return { retrySeconds, retryBlocked, startRetry, retryMessage };
}
