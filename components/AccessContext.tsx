"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PlanAccess, PlanId } from "@/lib/plans";

type AccessContextValue = {
  plan: PlanId;
  isAdmin: boolean;
  access: PlanAccess;
  userId: string;
  localMode: boolean;
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ value, children }: { value: AccessContextValue; children: ReactNode }) {
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function usePlanAccess() {
  const value = useContext(AccessContext);
  if (!value) throw new Error("usePlanAccess phải được dùng bên trong AccessProvider.");
  return value;
}
