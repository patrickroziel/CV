"use client";

import { usePortfolio } from "@/components/providers/PortfolioProvider";

/**
 * Renders children only when edit mode is active.
 * In production (non-localhost), edit is never allowed → always null.
 */
export function EditGate({ children }: { children: React.ReactNode }) {
  const { editMode, editAllowed } = usePortfolio();
  if (!editAllowed || !editMode) return null;
  return <>{children}</>;
}
