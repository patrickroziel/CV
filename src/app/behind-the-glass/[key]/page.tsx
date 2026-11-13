import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isBackofficeAdmin, privatePath } from "@/lib/server/backoffice-auth";
import { BackofficeHome } from "@/components/backoffice/BackofficeHome";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Espace privé",
  robots: { index: false, follow: false },
};

export default async function PrivateWorkspace({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!process.env.BACKOFFICE_SLUG || key !== process.env.BACKOFFICE_SLUG) notFound();
  return <BackofficeHome authenticated={await isBackofficeAdmin()} privatePath={privatePath()} />;
}
