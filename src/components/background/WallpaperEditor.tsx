"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { DEFAULT_BACKGROUND } from "@/lib/defaults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/shared/ImageUpload";

type WallpaperEditorProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function WallpaperEditor({ open, onOpenChange }: WallpaperEditorProps) {
  const { data, updateBackground, updateUi } = usePortfolio();
  const [url, setUrl] = useState(data.backgroundUrl);
  const [overlay, setOverlay] = useState(data.ui.overlayOpacity);
  const [showDock, setShowDock] = useState(data.ui.showDock);

  const handleOpen = (v: boolean) => {
    if (v) {
      setUrl(data.backgroundUrl);
      setOverlay(data.ui.overlayOpacity);
      setShowDock(data.ui.showDock);
    }
    onOpenChange(v);
  };

  const apply = () => {
    if (url.trim()) updateBackground(url.trim());
    updateUi({ overlayOpacity: overlay, showDock });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-teal-300" />
            Apparence
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="bg-url">URL du fond d’écran</Label>
            <Input
              id="bg-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
            <p className="text-xs text-zinc-500">
              URL externe ou upload Cloudinary (seule l’URL est stockée localement).
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Ou uploader une image</Label>
            <ImageUpload
              value={null}
              onChange={(url) => {
                if (url) setUrl(url);
              }}
              aspectClassName="aspect-video max-h-36"
              label="Upload fond (Cloudinary)"
              folder="patrick-roziel/wallpaper"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="overlay">
              Overlay sombre : {Math.round(overlay * 100)}%
            </Label>
            <input
              id="overlay"
              type="range"
              min={0.3}
              max={0.7}
              step={0.02}
              value={overlay}
              onChange={(e) => setOverlay(Number(e.target.value))}
              className="w-full accent-teal-300"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={showDock}
              onChange={(e) => setShowDock(e.target.checked)}
              className="rounded border-white/20"
            />
            Afficher le Dock (desktop)
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setUrl(DEFAULT_BACKGROUND)}
          >
            Fond forêt par défaut
          </Button>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={apply}>Appliquer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
