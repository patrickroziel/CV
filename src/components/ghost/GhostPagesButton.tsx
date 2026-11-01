"use client";

import Link from "next/link";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GhostPagesButton() {
  return (
    <Button variant="ghost" size="sm" title="Liste des pages fantômes" asChild>
      <Link href="/g">
        <Ghost className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Fantôme</span>
      </Link>
    </Button>
  );
}
