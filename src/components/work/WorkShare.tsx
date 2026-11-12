"use client";

import { useState } from "react";

const WORK_URL = "https://patrickroziel.com/work";

export function WorkShare({ embedded = false }: { embedded?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(WORK_URL);
    } catch {
      const field = document.createElement("textarea");
      field.value = WORK_URL;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.append(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2800);
  }

  const button = (
    <button
      type="button"
      onClick={() => void copyAddress()}
      className="w-full rounded-full border border-white/45 bg-white/15 px-3 py-2 text-left text-[0.84rem] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition hover:bg-white/25"
    >
      {copied ? "Adresse copiée" : "Partager le profil"}
    </button>
  );
  const hint = (
    <p className={`px-0.5 text-[11px] leading-snug text-zinc-200 ${embedded ? "mt-1.5" : "mt-2"}`}>
      {copied
        ? "Colle-la où tu veux. La carte du profil s’affiche toute seule."
        : "Copie l’adresse de Work. Rien ne s’ouvre : ni mail, ni réseau."}
    </p>
  );

  if (embedded) return <div className="w-full pt-1">{button}{hint}</div>;

  return (
    <div className="mt-3 rounded-[1.35rem] border border-white/20 bg-[rgba(8,20,14,0.72)] p-3.5">
      {button}
      {hint}
    </div>
  );
}
