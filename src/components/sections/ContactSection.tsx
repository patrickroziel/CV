"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Mail, MapPin, Play, Settings2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { EditGate } from "@/components/shared/EditGate";
import { ExtraDocumentButtons } from "@/components/shared/ExtraDocumentButtons";
import { RichHtml } from "@/components/shared/RichHtml";
import { ContactSettingsPanel } from "@/components/contact/ContactSettingsPanel";
import {
  EXTRA_DOCUMENT_IDS,
  type ContactConfig,
} from "@/lib/types";

function hasContactExtraDocs(c: ContactConfig): boolean {
  const docs = c.extraDocuments;
  if (!docs) return false;
  return EXTRA_DOCUMENT_IDS.some((id) => {
    const d = docs[id];
    return Boolean(d?.show && d.url?.trim() && d.showInContact);
  });
}

export function ContactSection() {
  const { data, showToast, editMode, l, t } = usePortfolio();
  const { profile, contact: c } = data;
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const email = c.emailValue.trim() || profile.email;
  const showreel = c.showreelUrl.trim() || profile.showreelUrl;
  const showExtraDocs = hasContactExtraDocs(c);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      showToast(t("contact.emailCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(t("contact.emailCopyFailed"));
    }
  };

  const sendMailto = (e: React.FormEvent) => {
    e.preventDefault();
    const who = name.trim() || t("contact.mailSubjectAnonymous");
    const subject = encodeURIComponent(
      `${t("contact.mailSubject")} — ${who}`
    );
    const body = encodeURIComponent(message || "");
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="relative z-10 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={l(c.sectionEyebrow)}
          title={l(c.sectionTitle)}
          description={l(c.introText)}
          action={
            <EditGate>
              <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
                <Settings2 className="h-4 w-4" />
                {t("contact.configureButtons")}
              </Button>
            </EditGate>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <GlassCard className="overflow-hidden p-6 sm:p-10">
            <div
              className={
                c.showForm
                  ? "grid gap-10 lg:grid-cols-2"
                  : "grid gap-10"
              }
            >
              <div>
                {c.showNameTitle && (
                  <>
                    <p className="text-lg font-semibold text-zinc-50">
                      {profile.name.replace(/<[^>]+>/g, "").trim() ||
                        profile.name}
                    </p>
                    <RichHtml
                      html={l(profile.title)}
                      className="mt-1 text-sm text-teal-300"
                    />
                  </>
                )}
                {c.showLocation && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                    <MapPin className="h-4 w-4 text-amber-400" />
                    {l(profile.location)}
                  </p>
                )}

                {(c.showEmail ||
                  c.showShowreel ||
                  showExtraDocs) && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    {c.showEmail && (
                      <MagneticButton>
                        <Button size="lg" asChild>
                          <a href={`mailto:${email}`}>
                            <Mail className="h-4 w-4" />
                            {l(c.emailLabel)}
                          </a>
                        </Button>
                      </MagneticButton>
                    )}
                    {c.showShowreel && showreel && (
                      <MagneticButton>
                        <Button size="lg" variant="outline" asChild>
                          <a
                            href={showreel}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Play className="h-4 w-4" />
                            {l(c.showreelLabel)}
                          </a>
                        </Button>
                      </MagneticButton>
                    )}
                    <ExtraDocumentButtons placement="contact" />
                  </div>
                )}

                {c.showCopyEmail && (
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-teal-300"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-teal-300" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {l(c.copyEmailLabel).trim() || email}
                  </button>
                )}

                {editMode && (
                  <p className="mt-6 text-xs text-zinc-600">
                    {t("contact.editHint")}
                  </p>
                )}
              </div>

              {c.showForm && (
                <form onSubmit={sendMailto} className="grid gap-4">
                  <p className="text-sm text-zinc-400">{l(c.formTitle)}</p>
                  <div className="grid gap-2">
                    <Label htmlFor="c-name">{t("contact.nameLabel")}</Label>
                    <Input
                      id="c-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("contact.namePlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="c-msg">{t("contact.messageLabel")}</Label>
                    <Textarea
                      id="c-msg"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder={t("contact.messagePlaceholder")}
                    />
                  </div>
                  <Button type="submit" className="w-full sm:w-auto">
                    <Mail className="h-4 w-4" />
                    {l(c.formSubmitLabel)}
                  </Button>
                </form>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <ContactSettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </section>
  );
}
