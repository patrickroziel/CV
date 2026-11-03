import { NextResponse } from "next/server";
import { getPublicNote } from "@/lib/server/notes-sharing";
import { getArticleAudio } from "@/lib/server/article-audio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { id?: unknown; voice?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return NextResponse.json({ error: "Identifiant d'article invalide." }, { status: 400 });
  }

  const voice = body.voice === "female" ? "female" : "male";
  const post = await getPublicNote(id);
  if (!post) {
    return NextResponse.json({ error: "Article introuvable ou non publié." }, { status: 404 });
  }

  try {
    const audio = await getArticleAudio(post, voice);
    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de génération audio.";
    const status = message.includes("configuration") || message.includes("Authentification") ? 503 : 502;
    console.error("[api/tts]", error);
    return NextResponse.json({ error: message }, { status });
  }
}
