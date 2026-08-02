import { AlertTriangle, CheckCircle2, ChevronDown, Lightbulb } from "lucide-react";

type GuideStep = {
  title: string;
  description: string;
};

type AdminGuidePanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  steps: GuideStep[];
  note?: string;
  defaultOpen?: boolean;
  className?: string;
};

export function AdminGuidePanel({
  eyebrow = "Panduan pengisian",
  title,
  description,
  steps,
  note,
  defaultOpen = false,
  className = ""
}: AdminGuidePanelProps) {
  return (
    <details
      open={defaultOpen}
      className={`admin-guide group overflow-hidden rounded-2xl border border-[#efc7aa] bg-[#fff8f1] ${className}`}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f15a16] text-white shadow-[0_8px_20px_rgba(241,90,22,.18)]">
            <Lightbulb className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#d84909]">{eyebrow}</p>
            <h2 className="mt-1 font-display text-xl font-bold text-[#17130f] sm:text-2xl">{title}</h2>
            <p className="mt-2 max-w-4xl text-xs leading-5 text-black/50 sm:text-sm sm:leading-6">{description}</p>
          </div>
        </div>
        <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-lg border border-black/10 bg-white text-black/45 transition-transform group-open:rotate-180">
          <ChevronDown className="size-4" />
        </span>
      </summary>

      <div className="border-t border-[#efc7aa] px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <ol className="grid gap-3 lg:grid-cols-2">
          {steps.map((step, index) => (
            <li key={`${step.title}-${index}`} className="flex items-start gap-3 rounded-xl border border-black/[.07] bg-white/80 p-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#17130f] text-xs font-black text-white">{index + 1}</span>
              <div>
                <p className="text-sm font-black text-[#17130f]">{step.title}</p>
                <p className="mt-1 text-xs leading-5 text-black/50">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        {note && (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#17130f] p-4 text-white">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#ff9d6e]" />
            <p className="text-xs leading-5 text-white/70"><strong className="text-white">Catatan penting:</strong> {note}</p>
          </div>
        )}
      </div>
    </details>
  );
}

export function GuideCheck({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-6 text-black/60">
      <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#f15a16]" />
      <span>{children}</span>
    </li>
  );
}
