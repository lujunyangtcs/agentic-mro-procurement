/**
 * An intake email exactly as the plant engineer sent it — in their own
 * language — with the workforce's translation appearing underneath.
 *
 * This is the translation layer at its most literal: the demo shows the real
 * inbound message untouched, then the agent reading it and producing the
 * standard-procurement-language version everything downstream is built from.
 * Nothing is pre-translated on screen; the viewer watches it happen.
 */

import * as React from "react";
import { Languages as LanguagesIcon } from "lucide-react";
import { EmailDoc } from "@/mro/components/docs/sources";
import { Spinner } from "@/mro/components/ai/Spinner";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { AIDot } from "@/mro/components/ai/AIDot";
import { useT } from "@/mro/lib/i18n";
import { LANGUAGES, type Lang } from "@/mro/data/procurement";
import { cn } from "@/mro/lib/utils";

export type MailBody = {
  subject: string;
  lines: string[];
};

export function MultilingualEmailDoc({
  from,
  fromAddr,
  to,
  sent,
  /** The message as it actually arrived. */
  original,
  /** The language it arrived in. */
  sourceLang,
  /** The same message in the workspace's working language. */
  translated,
  gateMs = 1200,
  highlight,
}: {
  from: string;
  fromAddr: string;
  to: string;
  sent: string;
  original: MailBody;
  sourceLang: Lang;
  translated: MailBody;
  gateMs?: number;
  /** A phrase in the ORIGINAL message to mark in yellow. */
  highlight?: string;
}) {
  const { t, lang } = useT();
  const src = LANGUAGES.find((l) => l.code === sourceLang)!;
  const needsWork = sourceLang !== lang;

  const [reading, setReading] = React.useState(needsWork);
  React.useEffect(() => {
    if (!needsWork) {
      setReading(false);
      return;
    }
    setReading(true);
    const timer = setTimeout(() => setReading(false), gateMs);
    return () => clearTimeout(timer);
  }, [needsWork, gateMs, lang]);

  return (
    <div className="space-y-3">
      {/* The message exactly as received — never altered. */}
      <div>
        <div className="flex items-center gap-2 pb-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-mute">
            {t("xlat.original")}
          </span>
          <span className="bg-surface-fog px-2.5 py-0.5 text-[12px] font-medium text-ink whitespace-nowrap">
            {t("xlat.writtenIn")} {src.native}
          </span>
        </div>
        <EmailDoc
          from={from}
          fromAddr={fromAddr}
          to={to}
          sent={sent}
          subject={original.subject}
          lines={original.lines}
          highlight={highlight}
        />
      </div>

      {/* What the workforce made of it. */}
      {needsWork && (
        <div className="rounded-lg border border-surface-deep/20 bg-surface-mint/35 overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-surface-deep/15 px-4 py-2.5">
            {reading ? <Spinner size={14} /> : <AIDot size={8} tone="deep" pulse />}
            <span className="text-[13px] font-semibold text-surface-deep">
              {reading ? t("xlat.working") : `${src.flag} → ${t("xlat.translated")}`}
            </span>
            <LanguagesIcon size={14} className="ml-auto text-surface-deep/60" />
          </div>

          <div className={cn("px-4 py-3.5 transition-opacity", reading && "opacity-0")}>
            {!reading && (
              <>
                <p className="text-[13px] font-bold text-ink">
                  <StreamingText text={translated.subject} cps={110} caret={false} />
                </p>
                <div className="mt-2 space-y-1.5">
                  {translated.lines.map((line, i) => (
                    <p key={line} className="text-[13px] leading-[19px] text-ink">
                      <StreamingText
                        text={line}
                        cps={190}
                        startDelay={260 + i * 220}
                        caret={false}
                      />
                    </p>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
