import { MediasFeed } from "@/components/medias/MediasFeed";

export default function MediasPage() {
  return (
    <main className="no-print relative z-10 pb-16 pt-28 sm:pt-32">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-violet-500/10 via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <MediasFeed />
      </div>
    </main>
  );
}
