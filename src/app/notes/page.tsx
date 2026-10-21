import { redirect } from "next/navigation";

/** The Notes feed lives at the domain root; individual /notes/[id] URLs stay intact. */
export default function NotesLegacyIndex() {
  redirect("/");
}
