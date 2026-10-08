import type { TaskInput } from "@/mro/services/demoLedger";
import type { TaskUi } from "@/mro/components/story/theatre/script";
import type { useTheatreCopy } from "@/mro/components/story/theatre/copy";

type Copy = ReturnType<typeof useTheatreCopy>["t"];

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

/** One line under a decided task saying what the person chose, typed or changed. */
export function taskNote(ui: TaskUi, optionId: string, input: TaskInput | undefined, lang: "en" | "de", t: Copy): string | undefined {
  if (ui.kind === "choice") {
    if (typeof input?.reason === "string") return `${t.reasonSaved}: “${input.reason}”`;
    const o = ui.options.find((x) => x.id === optionId);
    return o ? `${o.title} · ${o.figure}` : undefined;
  }
  if (ui.kind === "approve") return typeof input?.reason === "string" ? `${t.reasonSaved}: “${input.reason}”` : undefined;
  if (ui.kind === "email") return `${t.sentTo} ${ui.to} · ${input?.edited ? t.editedByYou : t.sentAsDrafted}`;
  if (optionId !== ui.accept || !input) return undefined;
  return ui.fields
    .map((f) => {
      const v = input[f.key];
      if (f.kind === "money") return `${f.label[lang]} ${gbp(Number(v))}`;
      if (f.kind === "number") return `${f.label[lang]} ${v} ${f.suffix[lang]}`;
      return v ? f.label[lang] : undefined;
    })
    .filter(Boolean)
    .join(" · ");
}
