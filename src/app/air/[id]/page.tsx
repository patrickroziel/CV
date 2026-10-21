import type { Metadata } from "next";
import { getPublicNote, getNoteShareText, getNoteSharePhoto, NOTES_ORIGIN } from "@/lib/server/notes-sharing";
import { AirArticle } from "@/components/air/AirArticle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id }=await params;
  const post=await getPublicNote(id);
  if (!post || post.universe !== "air") return { title: "Article indisponible — Air", robots:{index:false,follow:false} };
  const {title,description}=getNoteShareText(post);
  const image=getNoteSharePhoto(post)??`${NOTES_ORIGIN}/api/notes/${encodeURIComponent(id)}/share-image`;
  const url=`${NOTES_ORIGIN}/air/${encodeURIComponent(id)}`;
  return {title:`${title} — Air · Patrick Roziel`,description,alternates:{canonical:url},
    openGraph:{type:"article",url,title,description,images:[image]},
    twitter:{card:"summary_large_image",title,description,images:[image]}};
}
export default async function AirArticlePage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;return <main className="relative z-10 min-h-screen pb-24 pt-24 sm:pt-28"><AirArticle id={id}/></main>;
}
