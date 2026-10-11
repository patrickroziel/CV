"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Languages, LoaderCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DEFAULT_SITE_LANGUAGE,
  getSiteLanguage,
  SITE_LANGUAGES,
  SITE_LANGUAGE_STORAGE_KEY,
} from "@/lib/site-translation";
import { cn } from "@/lib/utils";

const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"] as const;
const CACHE_KEY = "patrick-google-translation-cache-v1";
const MAX_BATCH_ITEMS = 80;
const MAX_BATCH_CHARS = 4_800;
const MAX_CONCURRENT_BATCHES = 4;
const EXCLUDED_SELECTOR = [
  "script",
  "style",
  "noscript",
  "code",
  "pre",
  "textarea",
  "[contenteditable='true']",
  "[data-no-translate]",
  "[translate='no']",
].join(",");

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

type TranslationTarget =
  | { kind: "text"; node: Text; original: string }
  | { kind: "attribute"; element: Element; attribute: string; original: string };

function hasLetters(value: string) {
  return /\p{L}/u.test(value);
}

function shouldSkipElement(element: Element | null) {
  if (!element) return true;
  return Boolean(element.closest(EXCLUDED_SELECTOR));
}

function addElementAttributes(element: Element, targets: TranslationTarget[]) {
  if (shouldSkipElement(element)) return;
  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    const value = element.getAttribute(attribute);
    if (!value?.trim() || !hasLetters(value)) continue;
    let stored = originalAttributes.get(element);
    if (!stored) {
      stored = new Map<string, string>();
      originalAttributes.set(element, stored);
    }
    const original = stored.get(attribute) ?? value;
    if (!stored.has(attribute)) stored.set(attribute, original);
    targets.push({ kind: "attribute", element, attribute, original });
  }
}

function collectTargets(root: ParentNode = document.body): TranslationTarget[] {
  const targets: TranslationTarget[] = [];

  if (root instanceof Element) addElementAttributes(root, targets);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current: Node | null;

  while ((current = walker.nextNode())) {
    const node = current as Text;
    const parent = node.parentElement;
    if (!parent || shouldSkipElement(parent)) continue;

    const value = node.nodeValue ?? "";
    if (!value.trim() || !hasLetters(value)) continue;

    const stored = originalText.get(node);
    const original = stored ?? value;
    if (stored == null) originalText.set(node, original);
    targets.push({ kind: "text", node, original });
  }

  root.querySelectorAll?.("*").forEach((element) => addElementAttributes(element, targets));
  return targets;
}

function collectTargetsFromRoots(roots: ParentNode[]) {
  const targets: TranslationTarget[] = [];
  const seenText = new WeakSet<Text>();
  const seenAttributes = new WeakMap<Element, Set<string>>();

  for (const root of roots) {
    for (const target of collectTargets(root)) {
      if (target.kind === "text") {
        if (seenText.has(target.node)) continue;
        seenText.add(target.node);
      } else {
        let attrs = seenAttributes.get(target.element);
        if (!attrs) {
          attrs = new Set<string>();
          seenAttributes.set(target.element, attrs);
        }
        if (attrs.has(target.attribute)) continue;
        attrs.add(target.attribute);
      }
      targets.push(target);
    }
  }

  return targets;
}

function loadCache(): Record<string, Record<string, string>> {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Record<string, string>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, Record<string, string>>) {
  try {
    const compact: Record<string, Record<string, string>> = {};
    for (const [language, entries] of Object.entries(cache)) {
      compact[language] = Object.fromEntries(Object.entries(entries).slice(-1200));
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(compact));
  } catch {
    // Cache is optional. Translation still works without it.
  }
}

function decodeEntities(value: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

async function requestTranslations(texts: string[], target: string, signal: AbortSignal) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, target }),
    signal,
  });
  const payload = (await response.json()) as { translations?: string[]; error?: string };
  if (!response.ok || !payload.translations) {
    throw new Error(payload.error || "Traduction indisponible");
  }
  return payload.translations.map(decodeEntities);
}

function applyValue(target: TranslationTarget, value: string) {
  if (target.kind === "text") {
    if (target.node.isConnected) target.node.nodeValue = value;
    return;
  }
  if (target.element.isConnected) target.element.setAttribute(target.attribute, value);
}

function restoreTargets(targets: TranslationTarget[]) {
  targets.forEach((target) => applyValue(target, target.original));
}

function applyCachedTranslations(targets: TranslationTarget[], languageCache: Record<string, string>) {
  targets.forEach((item) => {
    const translated = languageCache[item.original.trim()];
    if (!translated) return;
    const leading = item.original.match(/^\s*/)?.[0] ?? "";
    const trailing = item.original.match(/\s*$/)?.[0] ?? "";
    applyValue(item, `${leading}${translated}${trailing}`);
  });
}

function buildBatches(texts: string[]) {
  const batches: string[][] = [];
  let current: string[] = [];
  let chars = 0;

  for (const text of texts) {
    const nextChars = chars + text.length;
    if (current.length && (current.length >= MAX_BATCH_ITEMS || nextChars > MAX_BATCH_CHARS)) {
      batches.push(current);
      current = [];
      chars = 0;
    }
    current.push(text);
    chars += text.length;
  }

  if (current.length) batches.push(current);
  return batches;
}

async function translateBatches({
  batches,
  target,
  signal,
  onTranslated,
}: {
  batches: string[][];
  target: string;
  signal: AbortSignal;
  onTranslated: (source: string, translated: string) => void;
}) {
  let nextIndex = 0;
  let firstError: Error | null = null;

  const worker = async () => {
    while (!signal.aborted) {
      const index = nextIndex++;
      if (index >= batches.length) return;
      const batch = batches[index];
      try {
        const translated = await requestTranslations(batch, target, signal);
        batch.forEach((source, itemIndex) => onTranslated(source, translated[itemIndex] ?? source));
      } catch (error) {
        if (signal.aborted) return;
        if (!firstError) {
          firstError = error instanceof Error ? error : new Error("Traduction partiellement indisponible");
        }
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT_BATCHES, Math.max(1, batches.length)) },
    () => worker()
  );
  await Promise.all(workers);
  return firstError;
}

export function SiteTranslator({ className }: { className?: string }) {
  const pathname = usePathname();
  const [languageCode, setLanguageCode] = useState(DEFAULT_SITE_LANGUAGE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const languageRef = useRef(DEFAULT_SITE_LANGUAGE);
  const mutationTimerRef = useRef<number | null>(null);
  const navigationTimerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const translatingRef = useRef(false);
  const pendingRootsRef = useRef<Set<ParentNode>>(new Set());
  const previousPathnameRef = useRef(pathname);

  const language = useMemo(() => getSiteLanguage(languageCode), [languageCode]);

  const translateTargets = useCallback(
    async (targets: TranslationTarget[], target: string, quiet = false, restoreFirst = false) => {
      if (!targets.length) return;
      const requestId = ++requestIdRef.current;

      if (!quiet) {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
      }
      const controller = quiet ? new AbortController() : abortRef.current ?? new AbortController();

      if (restoreFirst) restoreTargets(targets);

      if (target === DEFAULT_SITE_LANGUAGE) {
        document.documentElement.lang = "fr";
        document.documentElement.dataset.translationLanguage = "fr";
        setError(null);
        setBusy(false);
        return;
      }

      if (!quiet) setBusy(true);
      setError(null);
      translatingRef.current = true;

      try {
        const cache = loadCache();
        const languageCache = cache[target] ?? {};
        const unique = Array.from(new Set(targets.map((item) => item.original.trim()).filter(Boolean)));
        const missing = unique.filter((text) => languageCache[text] == null);
        const batches = buildBatches(missing);

        // Apply anything already cached immediately so the page starts changing at once.
        applyCachedTranslations(targets, languageCache);

        const batchError = await translateBatches({
          batches,
          target,
          signal: controller.signal,
          onTranslated: (source, translated) => {
            languageCache[source] = translated;
          },
        });

        if (controller.signal.aborted || languageRef.current !== target) return;
        if (!quiet && requestId !== requestIdRef.current) return;

        cache[target] = languageCache;
        saveCache(cache);
        applyCachedTranslations(targets, languageCache);

        document.documentElement.lang = target;
        document.documentElement.dataset.translationLanguage = target;

        if (batchError) {
          setError("Certaines parties n’ont pas encore pu être traduites. Le reste de la page reste utilisable.");
        }
      } finally {
        translatingRef.current = false;
        if (!quiet && requestId === requestIdRef.current) setBusy(false);
      }
    },
    []
  );

  const translateCurrentPage = useCallback(
    async (target: string, quiet = false) => {
      const targets = collectTargets();
      await translateTargets(targets, target, quiet, true);
    },
    [translateTargets]
  );

  const translatePendingRoots = useCallback(async () => {
    if (languageRef.current === DEFAULT_SITE_LANGUAGE || translatingRef.current) return;
    const roots = Array.from(pendingRootsRef.current);
    pendingRootsRef.current.clear();
    if (!roots.length) return;
    const targets = collectTargetsFromRoots(roots);
    await translateTargets(targets, languageRef.current, true, false);
  }, [translateTargets]);

  useEffect(() => {
    const saved = localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY) || DEFAULT_SITE_LANGUAGE;
    const initial = SITE_LANGUAGES.some((item) => item.code === saved) ? saved : DEFAULT_SITE_LANGUAGE;
    languageRef.current = initial;
    setLanguageCode(initial);
    window.setTimeout(() => void translateCurrentPage(initial), 100);
    return () => abortRef.current?.abort();
  }, [translateCurrentPage]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    if (languageRef.current === DEFAULT_SITE_LANGUAGE) return;
    if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current);
    if (mutationTimerRef.current) window.clearTimeout(mutationTimerRef.current);
    pendingRootsRef.current.clear();
    navigationTimerRef.current = window.setTimeout(() => {
      void translateCurrentPage(languageRef.current, true);
    }, 120);
  }, [pathname, translateCurrentPage]);

  useEffect(() => {
    const observer = new MutationObserver((records) => {
      if (languageRef.current === DEFAULT_SITE_LANGUAGE || translatingRef.current) return;

      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            pendingRootsRef.current.add(node as Element);
          } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            pendingRootsRef.current.add(node.parentElement);
          }
        }
      }

      if (!pendingRootsRef.current.size) return;
      if (mutationTimerRef.current) window.clearTimeout(mutationTimerRef.current);
      mutationTimerRef.current = window.setTimeout(() => {
        void translatePendingRoots();
      }, 260);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (mutationTimerRef.current) window.clearTimeout(mutationTimerRef.current);
      if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current);
    };
  }, [translatePendingRoots]);

  const chooseLanguage = (next: string) => {
    abortRef.current?.abort();
    languageRef.current = next;
    setLanguageCode(next);
    localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, next);
    void translateCurrentPage(next);
  };

  return (
    <div className={cn("relative", className)} data-no-translate="true" translate="no">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="translation-trigger glass-chip inline-flex h-9 max-w-[10.5rem] items-center gap-2 rounded-2xl px-2.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-white/[0.09] sm:max-w-none sm:px-3"
            aria-label={`Langue du site : ${language.label}`}
            title="Traduire le site"
          >
            {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-cyan-200" /> : <Languages className="h-3.5 w-3.5 text-cyan-200" />}
            <span aria-hidden className="text-sm leading-none">{language.flag}</span>
            <span className="hidden max-w-[8rem] truncate sm:inline">{language.nativeLabel}</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={9}
          data-no-translate="true"
          translate="no"
          className="translation-menu max-h-[72vh] w-[min(92vw,20rem)] overflow-y-auto border-cyan-100/15 bg-[#031014]/94 p-1.5 shadow-2xl"
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100/45">Traduire le site</div>
            <div className="mt-1 text-[11px] text-zinc-400">Traduction automatique · Google</div>
          </div>
          {SITE_LANGUAGES.map((item) => {
            const active = item.code === languageCode;
            return (
              <DropdownMenuItem
                key={item.code}
                onSelect={() => chooseLanguage(item.code)}
                className={cn(
                  "min-h-10 cursor-pointer justify-between px-2.5 py-2 focus:bg-cyan-100/[0.08]",
                  active && "bg-cyan-100/[0.09] text-cyan-50"
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="text-base leading-none">{item.flag}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{item.label}</span>
                    {item.nativeLabel !== item.label && (
                      <span className="block truncate text-[10px] text-zinc-500">{item.nativeLabel}</span>
                    )}
                  </span>
                </span>
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-cyan-200" />}
              </DropdownMenuItem>
            );
          })}
          {error && (
            <div className="mx-1 mt-1 rounded-xl border border-amber-300/15 bg-amber-300/[0.07] px-2.5 py-2 text-[10px] leading-relaxed text-amber-100/80">
              {error}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
