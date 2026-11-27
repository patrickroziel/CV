import { TipsLink } from "@/components/layout/SupportBar";

export function SectionHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h1 className="min-w-0 text-xl font-semibold tracking-tight text-white md:text-3xl">{title}</h1>
        <TipsLink compact />
      </div>
      {children ? (
        <p className="mt-1 text-xs leading-snug text-white/70 md:mt-2 md:text-[13px] md:leading-5">{children}</p>
      ) : null}
    </div>
  );
}
