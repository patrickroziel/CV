import { notFound, redirect } from "next/navigation";
import { isBackofficeAdmin, privatePath } from "@/lib/server/backoffice-auth";
import { CommentModeration } from "@/components/backoffice/CommentModeration";

export const dynamic = "force-dynamic";
export default async function CommentsAdminPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!process.env.BACKOFFICE_SLUG || key !== process.env.BACKOFFICE_SLUG) notFound();
  if (!(await isBackofficeAdmin())) redirect(privatePath());
  return <CommentModeration backofficePath={privatePath()} />;
}
