"use client";

import { useEffect, useState } from "react";
import { usePlanAccess } from "@/components/AccessContext";
import PricingModal from "@/components/PricingModal";

export default function UpgradePage() {
  const { plan, isAdmin } = usePlanAccess();
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("theme");
    const saved = window.localStorage.getItem("tarot-practice-theme-v2");
    const next = requested === "light" || requested === "dark"
      ? requested
      : saved === "light" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("tarot-practice-theme-v2", next);
    document.documentElement.dataset.theme = next;
  }, []);

  return (
    <main className={`upgrade-page theme-${theme}`} data-theme={theme}>
      <PricingModal
        open
        pageMode
        currentPlan={plan}
        isAdmin={isAdmin}
        onClose={() => window.location.assign("/")}
      />
    </main>
  );
}
