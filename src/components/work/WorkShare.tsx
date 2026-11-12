"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

const WORK_URL = "https://patrickroziel.com/work";

export function WorkShare({ embedded = false, plain = false, icon = false, pill = false }: { embedded?: boolean; plain?: boolean; icon?: boolean; pill?: boolean }) {
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
      className="w-full rounded-full border border-white/18 bg-white/[0.07] px-3 py-1.5 text-left text-[12px] font-medium tracking-wide text-zinc-50 transition hover:bg-white/[0.12]"
    >
      {copied ? "Adresse copiée" : "Partager le profil"}
    </button>
  );
  const hint = copied ? (
    <p className="mt-1.5 px-0.5 text-[11px] leading-snug text-zinc-300">
      Colle-la où tu veux. La carte du profil s’affiche toute seule.
    </p>
  ) : null;

  if (pill) {
    return (
      <button
        type="button"
        onClick={() => void copyAddress()}
        className="inline-flex w-fit items-center rounded-full border border-white/22 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-white/16"
      >
        {copied ? "Adresse copiée" : "Partager le profil"}
      </button>
    );
  }

  if (icon) {
    return (
      <button
        type="button"
        onClick={() => void copyAddress()}
        className="dock-icon"
        aria-label={copied ? "Adresse copiée" : "Partager le profil"}
        title={copied ? "Adresse copiée" : "Partager le profil"}
      >
        <Share2 aria-hidden />
      </button>
    );
  }

  if (plain) {
    return (
      <button
        type="button"
        onClick={() => void copyAddress()}
        className="flex w-full shrink-0 items-center rounded-xl px-2.5 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white md:w-full"
      >
        {copied ? "Adresse copiée" : "Partager le profil"}
      </button>
    );
  }

  if (embedded) return <div className="w-full pt-1">{button}{hint}</div>;

  return (
    <div className="mt-3 rounded-[1.35rem] border border-white/20 bg-[rgba(8,20,14,0.72)] p-3.5">
      {button}
      {hint}
    </div>
  );
}
