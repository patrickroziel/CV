import { BookReader } from "@/components/notes/BookReader";

export default async function BookChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="no-print relative z-10 min-h-screen pb-20 pt-24 sm:pt-28">
      <BookReader id={id} />
    </main>
  );
}
