"use client";

import {
  AtSign,
  Film,
  Globe,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Share2,
  type LucideIcon,
} from "lucide-react";
import type { QuickContactIcon } from "@/lib/types";

export const QUICK_CONTACT_ICON_MAP: Record<QuickContactIcon, LucideIcon> = {
  mail: Mail,
  phone: Phone,
  play: Play,
  link: Link2,
  linkedin: Share2,
  instagram: AtSign,
  youtube: Film,
  map: MapPin,
  message: MessageCircle,
  globe: Globe,
};

export const QUICK_CONTACT_ICON_OPTIONS: {
  value: QuickContactIcon;
  label: string;
}[] = [
  { value: "mail", label: "Email" },
  { value: "phone", label: "Téléphone" },
  { value: "play", label: "Play / Showreel" },
  { value: "link", label: "Lien" },
  { value: "linkedin", label: "LinkedIn / Réseau" },
  { value: "instagram", label: "Instagram / @" },
  { value: "youtube", label: "YouTube / Vidéo" },
  { value: "map", label: "Lieu" },
  { value: "message", label: "Message" },
  { value: "globe", label: "Site web" },
];

export function QuickContactIconView({
  name,
  className,
}: {
  name: QuickContactIcon;
  className?: string;
}) {
  const Icon = QUICK_CONTACT_ICON_MAP[name] || Link2;
  return <Icon className={className} />;
}
