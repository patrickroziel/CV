"use client";

import { useState } from "react";

const WORK_URL = "https://patrickroziel.com/work";

export function WorkShare() {
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

  return (
    <div className="mt-3 rounded-[1.35rem] border border-white/10 bg-[rgba(4,16,20,0.82)] p-3.5 shadow-[0_18px_44px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl">
      <button
        type="button"
        onClick={() => void copyAddress()}
        className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-left text-[0.84rem] font-medium text-zinc-50 transition hover:bg-white/[0.1]"
      >
        {copied ? "Adresse copiée" : "Partager le profil"}
      </button>
      <p className="mt-2 px-0.5 text-[11px] leading-snug text-zinc-400">
        {copied
          ? "Colle-la où tu veux. La carte du profil s’affiche toute seule."
          : "Copie l’adresse de Work. Rien ne s’ouvre : ni mail, ni réseau."}
      </p>
    </div>
  );
}
