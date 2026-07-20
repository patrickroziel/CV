"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { SkillDetailModal } from "@/components/skills/SkillDetailModal";
import { SkillEditDialog } from "@/components/skills/SkillEditDialog";
import { findSkillByLabel, skillPlaceholder } from "@/lib/skills";
import { getL } from "@/lib/i18n-content";
import type { Skill } from "@/lib/types";

type SkillDetailContextValue = {
  /** Open detail by skill id, full name, or free-form tag label */
  openSkillDetail: (labelOrId: string) => void;
  closeSkillDetail: () => void;
  /** Open create / edit form (Mode Édition) */
  openSkillEditor: (opts?: { skill?: Skill | null; seedName?: string }) => void;
};

const SkillDetailContext = createContext<SkillDetailContextValue | null>(null);

export function useSkillDetail(): SkillDetailContextValue {
  const ctx = useContext(SkillDetailContext);
  if (!ctx) {
    throw new Error("useSkillDetail must be used within SkillDetailProvider");
  }
  return ctx;
}

export function useSkillDetailOptional(): SkillDetailContextValue | null {
  return useContext(SkillDetailContext);
}

type SkillDetailProviderProps = {
  children: ReactNode;
};

/**
 * Global skill detail + edit host.
 * Any SkillTag / openSkillDetail() call opens the same fiche card site-wide.
 */
export function SkillDetailProvider({ children }: SkillDetailProviderProps) {
  const { data, editMode, addSkill, updateSkill } = usePortfolio();

  const [detailOpen, setDetailOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [seedName, setSeedName] = useState("");

  // Keep detail in sync when skills are updated while modal is open
  const liveMatched = useMemo(() => {
    if (!query) return null;
    return findSkillByLabel(data.skills, query);
  }, [data.skills, query]);

  const skill = useMemo(() => {
    if (!query) return null;
    return liveMatched ?? skillPlaceholder(query);
  }, [liveMatched, query]);

  const openSkillDetail = useCallback((labelOrId: string) => {
    const q = labelOrId.trim();
    if (!q) return;
    setQuery(q);
    setDetailOpen(true);
  }, []);

  const closeSkillDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const openSkillEditor = useCallback(
    (opts?: { skill?: Skill | null; seedName?: string }) => {
      if (opts?.skill) {
        setEditing(opts.skill);
        setSeedName("");
      } else {
        setEditing(null);
        setSeedName(opts?.seedName?.trim() || "");
      }
      setEditOpen(true);
    },
    []
  );

  const value = useMemo(
    () => ({ openSkillDetail, closeSkillDetail, openSkillEditor }),
    [openSkillDetail, closeSkillDetail, openSkillEditor]
  );

  return (
    <SkillDetailContext.Provider value={value}>
      {children}

      <SkillDetailModal
        skill={skill}
        label={query}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        editMode={editMode}
        matched={Boolean(liveMatched)}
        onEdit={() => {
          setDetailOpen(false);
          if (liveMatched) {
            openSkillEditor({ skill: liveMatched });
          } else {
            openSkillEditor({ seedName: query || "" });
          }
        }}
      />

      <SkillEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={editing}
        seedName={seedName}
        onSave={(payload, editingId) => {
          if (editingId) updateSkill(editingId, payload);
          else addSkill(payload);
          // Re-open detail on the saved name for continuity
          setQuery(getL(payload.name));
          setDetailOpen(true);
        }}
      />
    </SkillDetailContext.Provider>
  );
}
