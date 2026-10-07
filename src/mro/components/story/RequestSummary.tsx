import type { RequestCard } from "@/mro/data/stories/runModel";
import { formatValue, CHANNEL_ICON, gbpWhole } from "@/mro/components/story/format";
import { useStoryCopy } from "@/mro/components/story/copy";

/** The request exactly as the I/O records it arriving. */
export function RequestSummary({ request, compact = false }: { request: RequestCard; compact?: boolean }) {
  const { c } = useStoryCopy();
  const Icon = CHANNEL_ICON[request.channelKind];
  const who = request.requester;

  const facts: { label: string; value: string }[] = [
    { label: c.startingCost, value: gbpWhole(request.startingCostGBP) },
    ...(request.valueBand ? [{ label: c.valueBand, value: request.valueBand }] : []),
    ...(request.needBy ? [{ label: c.needBy, value: new Date(request.needBy).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }] : []),
    { label: c.received, value: formatValue("timestamp", request.receivedAt) },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[12px] leading-[16px] text-mute">
        <Icon size={14} strokeWidth={1.75} aria-hidden />
        <span className="truncate">{request.channel}</span>
        <span className="ml-auto shrink-0 font-medium text-ink">{request.requestId}</span>
      </div>
      <div>
        <p className="text-[16px] font-bold leading-[22px] text-ink text-balance">{request.headline}</p>
        <p className="mt-1 text-[13px] leading-[19px] text-mute text-pretty">{request.detail}</p>
      </div>
      {who && (
        <p className="text-[13px] leading-[19px] text-ink">
          <span className="text-mute">{c.requester}: </span>
          {[who.name, who.role, who.function, who.site].filter(Boolean).join(" · ")}
          {who.costCentre ? ` · ${who.costCentre}` : ""}
        </p>
      )}
      <dl className={compact ? "grid grid-cols-2 gap-x-4 gap-y-2" : "grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4"}>
        {facts.map((f) => (
          <div key={f.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-[12px] leading-[16px] text-mute">{f.label}</dt>
            <dd className="truncate text-[13.5px] font-medium leading-[19px] text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>
      {!compact && (
        <dl className="flex flex-col gap-2 border-t border-divider pt-3">
          {request.fields.map((f) => (
            <div key={f.label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
              <dt className="text-[12.5px] leading-[18px] text-mute">{f.label}</dt>
              <dd className="text-[13px] leading-[18px] text-ink text-pretty">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
