"use client";

import { createContext, useContext, type ReactNode } from "react";

type ReaderMode = "tarot" | "lenormand" | "combined";
type ReaderNavigationValue = { selectReader: (mode: ReaderMode) => void };
const ReaderNavigationContext = createContext<ReaderNavigationValue | null>(null);

export function ReaderNavigationProvider({ children, selectReader }: { children: ReactNode; selectReader: (mode: ReaderMode) => void }) {
  return <ReaderNavigationContext.Provider value={{ selectReader }}>{children}</ReaderNavigationContext.Provider>;
}

export function useReaderNavigation() {
  const value = useContext(ReaderNavigationContext);
  if (!value) throw new Error("ReaderNavigationProvider chưa được khởi tạo.");
  return value;
}
