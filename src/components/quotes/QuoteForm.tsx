"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, Loader2, Send, X } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { uploadToBlob, MEDIA_FOLDERS } from "@/lib/blob-upload";
import type { QuoteServiceId } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROJECT_TYPES: Record<QuoteServiceId, string[]> = {
  montage: [
    "Film corporate / institutionnel",
    "Interview / témoignage",
    "Reportage / aftermovie",
    "Aftermovie événement",
    "Série documentaire / long-form",
    "Recut / versioning multi-formats",
    "Autre",
  ],
  motion: [
    "Habillage / package TV ou digital",
    "Lower-thirds & titres",
    "Explainer / motion 2D",
    "Logo animation / intro",
    "Transitions & stingers",
    "Template After Effects",
    "Autre",
  ],
  social: [
    "Reels / TikTok / Shorts (série)",
    "Cut-downs social depuis un master",
    "Stories / carrousels animés",
    "Campagne multi-plateformes",
    "Templates réutilisables",
    "Autre",
  ],
  captation: [
    "Événement / conférence",
    "Interview multi-cam",
    "Film d’entreprise (tournage + post)",
    "Captation live / streaming",
    "Shooting studio / product",
    "Autre",
  ],
  pack: [
    "Lancement produit / marque",
    "Campagne content (série)",
    "Événement + post + social",
    "Retainer mensuel contenus",
    "Refonte audiovisuelle complète",
    "Autre",
  ],
};

const BUDGET_RANGES = [
  "À définir / me conseiller",
  "Moins de 500 €",
  "500 – 1 500 €",
  "1 500 – 3 000 €",
  "3 000 – 6 000 €",
  "6 000 – 12 000 €",
  "Plus de 12 000 €",
];

const VOLUME_HINTS = [
  "1 pièce courte (< 1 min)",
  "1 film (1–5 min)",
  "1 film long (5–15 min)",
  "Série 3–5 pièces",
  "Série 6–12 pièces",
  "Volume mensuel / retainer",
  "Autre (préciser dans la description)",
];

type QuoteFormProps = {
  serviceId: QuoteServiceId;
  serviceTitle: string;
  className?: string;
};

export function QuoteForm({
  serviceId,
  serviceTitle,
  className,
}: QuoteFormProps) {
  const { data, showToast, t } = usePortfolio();
  const emailTo = data.profile.email;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [projectType, setProjectType] = useState(
    PROJECT_TYPES[serviceId][0] ?? ""
  );
  const [description, setDescription] = useState("");
  const [volume, setVolume] = useState(VOLUME_HINTS[0]);
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState(BUDGET_RANGES[0]);
  const [references, setReferences] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setError(null);
    if (file.size > 25 * 1024 * 1024) {
      setError(t("quotes.fileTooLarge"));
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadToBlob(file, {
        folder: MEDIA_FOLDERS.documents,
        resourceType: "auto",
        onProgress: setUploadProgress,
      });
      setFileUrl(result.url);
      setFileName(file.name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("quotes.fileUploadFailed")
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [t]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError(t("quotes.errName"));
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t("quotes.errEmail"));
      return;
    }
    if (!description.trim()) {
      setError(t("quotes.errDescription"));
      return;
    }

    const lines = [
      `Demande de devis — ${serviceTitle}`,
      `Service: ${serviceId}`,
      "",
      `Nom: ${lastName.trim()}`,
      `Prénom: ${firstName.trim()}`,
      `Email: ${email.trim()}`,
      `Entreprise: ${company.trim() || "—"}`,
      "",
      `Type de projet: ${projectType}`,
      `Volume / durée: ${volume}`,
      `Deadline souhaitée: ${deadline.trim() || "Non précisée"}`,
      `Budget indicatif: ${budget}`,
      "",
      "Description du besoin:",
      description.trim(),
      "",
      "Références / liens:",
      references.trim() || "—",
      "",
      fileUrl
        ? `Fichier joint: ${fileName || "fichier"} — ${fileUrl}`
        : "Fichier joint: —",
    ];

    const subject = encodeURIComponent(
      `[Devis ${serviceId}] ${firstName.trim()} ${lastName.trim()}${
        company.trim() ? ` — ${company.trim()}` : ""
      }`
    );
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
    showToast(t("quotes.mailOpened"));
  };

  const selectClass =
    "flex h-10 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/20";

  return (
    <form
      onSubmit={submit}
      className={cn("grid gap-5", className)}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="q-first">{t("quotes.firstName")} *</Label>
          <Input
            id="q-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("quotes.firstNamePh")}
            autoComplete="given-name"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="q-last">{t("quotes.lastName")} *</Label>
          <Input
            id="q-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t("quotes.lastNamePh")}
            autoComplete="family-name"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="q-email">{t("quotes.email")} *</Label>
          <Input
            id="q-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@entreprise.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="q-company">
            {t("quotes.company")}{" "}
            <span className="text-zinc-500">({t("quotes.optional")})</span>
          </Label>
          <Input
            id="q-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={t("quotes.companyPh")}
            autoComplete="organization"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="q-type">{t("quotes.projectType")} *</Label>
        <select
          id="q-type"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          className={selectClass}
        >
          {PROJECT_TYPES[serviceId].map((opt) => (
            <option key={opt} value={opt} className="bg-zinc-900">
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="q-desc">{t("quotes.description")} *</Label>
        <Textarea
          id="q-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder={t("quotes.descriptionPh")}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="q-volume">{t("quotes.volume")}</Label>
          <select
            id="q-volume"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className={selectClass}
          >
            {VOLUME_HINTS.map((opt) => (
              <option key={opt} value={opt} className="bg-zinc-900">
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="q-deadline">{t("quotes.deadline")}</Label>
          <Input
            id="q-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="q-budget">{t("quotes.budget")}</Label>
        <select
          id="q-budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className={selectClass}
        >
          {BUDGET_RANGES.map((opt) => (
            <option key={opt} value={opt} className="bg-zinc-900">
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="q-refs">
          {t("quotes.references")}{" "}
          <span className="text-zinc-500">({t("quotes.optional")})</span>
        </Label>
        <Textarea
          id="q-refs"
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          rows={2}
          placeholder={t("quotes.referencesPh")}
        />
      </div>

      <div className="grid gap-2">
        <Label>
          {t("quotes.attachment")}{" "}
          <span className="text-zinc-500">({t("quotes.optional")})</span>
        </Label>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!uploading) fileRef.current?.click();
            }
          }}
          onClick={() => {
            if (!uploading) fileRef.current?.click();
          }}
          className={cn(
            "flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-black/20 px-3 py-4 text-center transition hover:border-white/35",
            uploading && "pointer-events-none opacity-80"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-teal-300" />
              <span className="text-xs text-zinc-400">
                {t("quotes.uploading")} {uploadProgress}%
              </span>
            </>
          ) : fileUrl ? (
            <div className="flex w-full items-center gap-2 text-left">
              <FileUp className="h-4 w-4 shrink-0 text-teal-300" />
              <span className="min-w-0 flex-1 truncate text-xs text-zinc-200">
                {fileName || fileUrl}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  setFileUrl(null);
                  setFileName(null);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <FileUp className="h-5 w-5 text-zinc-500" />
              <span className="text-xs text-zinc-400">
                {t("quotes.attachmentHint")}
              </span>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.mp4,.mov,.txt"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            void onFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" size="lg" disabled={uploading}>
          <Send className="h-4 w-4" />
          {t("quotes.submit")}
        </Button>
        <p className="text-[11px] text-zinc-500">{t("quotes.submitHint")}</p>
      </div>
    </form>
  );
}
