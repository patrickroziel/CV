"use client";

import { usePortfolio } from "@/components/providers/PortfolioProvider";

export function Footer() {
  const { data, resetToDefaults, editMode } = usePortfolio();
  const year = new Date().getFullYear();

  return (
    <footer className="no-print relative z-10 border-t border-white/12 bg-gradient-to-t from-black/40 to-transparent pb-28 pt-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] lg:pb-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-zinc-500">
          © {year} {data.profile.name}. Portfolio personnel — glassmorphism.
        </p>
        {editMode && (
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "Réinitialiser toutes les données avec le profil ATS par défaut ?"
                )
              ) {
                resetToDefaults();
              }
            }}
            className="text-left text-xs text-zinc-600 transition-colors hover:text-zinc-400 sm:text-right"
          >
            Réinitialiser les données
          </button>
        )}
      </div>
    </footer>
  );
}
