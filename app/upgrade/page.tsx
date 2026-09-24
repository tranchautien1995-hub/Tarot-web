"use client";

import { useEffect, useState } from "react";
import { usePlanAccess } from "@/components/AccessContext";
import PricingModal from "@/components/PricingModal";

export default function UpgradePage() {
  const { plan, isAdmin } = usePlanAccess();
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem("tarot-practice-theme-v2");
    const next = saved === "light" ? "light" : "dark";
    setTheme(next);
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
