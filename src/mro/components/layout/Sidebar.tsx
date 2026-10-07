import * as React from "react";
import { cn } from "@/mro/lib/utils";
import { useApp, type View } from "@/mro/state";
import { useT } from "@/mro/lib/i18n";
import { agentsById, type AgentId } from "@/mro/data/agents";
import {
  LayoutDashboard,
  FileText,
  CircleAlert,
  Receipt,
  Headset,
  MessageSquare,
  Globe,
  PenLine,
  Lightbulb,
  Scale,
  Building2,
  FileSignature,
  BadgePoundSterling,
  Landmark,
  SlidersHorizontal,
  ListChecks,
} from "lucide-react";
import { PresenterControls } from "@/mro/components/desk/PresenterControls";
import { useWorkQueue } from "@/mro/components/desk/workQueue";
import { useProcurement } from "@/mro/data/store";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  view?: View;
  badge?: { kind: "star" } | { kind: "count"; value: number };
  comingSoon?: boolean;
};

type Section = {
  title: string;
  items: NavItem[];
};

/* Build a nav item straight from the agent catalog so labels + icons match. */
const agentItem = (id: AgentId): NavItem => ({
  label: agentsById[id].menuLabel,
  icon: agentsById[id].icon,
  view: { kind: "agent", id },
});

/** Built per render so every label follows the reader's chosen language. */
const buyerSectionsFor = (t: (key: string) => string, badges: { approvals: number; holds: number }): Section[] => [
  {
    /* The buyer's own desk — the work, rather than the workforce. */
    title: t("nav.myDesk"),
    items: [
      { label: t("nav.dashboard"), icon: LayoutDashboard, view: { kind: "cockpit" } },
      { label: t("nav.desk"), icon: ListChecks, view: { kind: "desk" }, badge: badges.approvals ? { kind: "count", value: badges.approvals } : undefined },
      { label: t("nav.newRequest"), icon: PenLine, view: { kind: "agent", id: "intake" } },
      { label: t("nav.requisitions"), icon: FileText, view: { kind: "requisitions" } },
      { label: t("nav.exceptions"), icon: CircleAlert, view: { kind: "exceptions" }, badge: badges.holds ? { kind: "count", value: badges.holds } : undefined },
      { label: t("nav.invoiceMatching"), icon: Receipt, view: { kind: "invoice-matching" } },
      { label: t("nav.serviceDesk"), icon: Headset, view: { kind: "service-desk" } },
    ],
  },
  {
    title: t("nav.workbenches"),
    items: [
      { label: t("nav.opportunities"), icon: Lightbulb, view: { kind: "opportunities" } },
      { label: t("nav.sourcingBench"), icon: Scale, view: { kind: "sourcing" } },
      { label: t("nav.suppliers"), icon: Building2, view: { kind: "suppliers" } },
      { label: t("nav.contracts"), icon: FileSignature, view: { kind: "contracts" } },
    ],
  },
  {
    title: t("nav.assurance"),
    items: [
      { label: t("nav.value"), icon: BadgePoundSterling, view: { kind: "value" } },
      { label: t("nav.governance"), icon: Landmark, view: { kind: "governance" } },
      { label: t("nav.controlTower"), icon: Globe, view: { kind: "control-tower" } },
      { ...agentItem("orchestrator"), label: t("nav.agentWorkforce") },
    ],
  },
];

/**
 * What the supplier sees — their own portal, nothing of the buyer's desk.
 * Built per render so the labels follow the supplier's chosen language.
 */
const supplierSectionsFor = (t: (key: string) => string): Section[] => [
  {
    title: t("sp.chip"),
    items: [
      { label: t("sp.overviewTitle"), icon: LayoutDashboard, view: { kind: "supplier-overview" } },
      { label: t("sp.askTitle"), icon: MessageSquare, view: { kind: "supplier-center" } },
    ],
  },
];

function isItemActive(item: NavItem, view: View): boolean {
  if (!item.view) return false;
  if (item.view.kind === "agent") return view.kind === "agent" && view.id === item.view.id;
  if (item.view.kind === "cockpit") return view.kind === "cockpit" || view.kind === "case";
  return item.view.kind === view.kind;
}

export function Sidebar() {
  const { view, go, signOut, persona } = useApp();
  const { t } = useT();
  const { session } = useProcurement();
  const { approvals, exceptions } = useWorkQueue();
  const [presenter, setPresenter] = React.useState(false);
  const isSupplier = persona === "supplier";
  const sectionsForPersona = isSupplier
    ? supplierSectionsFor(t)
    : buyerSectionsFor(t, { approvals: approvals.filter((a) => a.role === session.reviewAs).length, holds: exceptions.length });

  return (
    <aside className="flex flex-col w-[240px] shrink-0 h-screen bg-white border-r border-divider sticky top-0">
      {/* Brand */}
      <div className="border-b border-divider px-5 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="min-w-0 leading-tight">
            <div className="aap-eyebrow text-[11.5px] leading-[16px] text-ink text-balance">
              {isSupplier ? t("sp.chip") : t("brand.name")}
            </div>
            <button
              type="button"
              onClick={() => setPresenter(true)}
              aria-haspopup="dialog"
              className="aap-link mt-0.5 inline-flex items-center gap-1 whitespace-nowrap text-[12px] text-mute hover:text-ink"
            >
              <SlidersHorizontal size={11} aria-hidden />
              {t("brand.demo")}
            </button>
          </div>
        </div>
      </div>
      <PresenterControls open={presenter} onClose={() => setPresenter(false)} />

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto pt-4">
        {sectionsForPersona.map((section) => (
          <div key={section.title} className="pb-4">
            <div className="aap-eyebrow px-5 pb-1.5 text-[11px] text-steel">
              {section.title}
            </div>
            <ul>
              {section.items.map((item) => {
                const isActive = isItemActive(item, view);
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      disabled={item.comingSoon}
                      onClick={() => item.view && go(item.view)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "aap-nav-item w-full flex items-center gap-3 px-5 py-2 text-[13.5px] text-left transition-colors duration-150 ease-out",
                        isActive && "bg-surface-fog text-ink font-medium",
                        !isActive && !item.comingSoon && "text-mute hover:text-ink hover:bg-surface-fog/60",
                        item.comingSoon && "text-mute cursor-not-allowed",
                      )}
                    >
                      <Icon size={16} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge?.kind === "star" && (
                        <span className="text-surface-deep text-[12px]">★</span>
                      )}
                      {item.badge?.kind === "count" && (
                        <span className="min-w-5 bg-ink px-1.5 py-0.5 text-center text-[11px] leading-[14px] text-ink-inverse tabular-nums">
                          {item.badge.value}
                        </span>
                      )}
                      {item.comingSoon && <span className="text-[11px] text-mute">{t("nav.soon")}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Changing chairs means signing out and coming back through the door,
          the way a real person would — so there is no switch here. */}
      {/* Persona footer */}
      <div className="flex items-center gap-3 border-t border-divider px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center border border-ink/25 text-[12px] tracking-[0.08em] text-ink">
          {isSupplier ? "AR" : "PB"}
        </div>
        <div className="leading-tight flex-1 min-w-0">
          <div className="text-[13px] text-ink truncate">
            {t(isSupplier ? "brand.desk.supplier" : "brand.desk.buyer")}
          </div>
          <button type="button" onClick={signOut} className="aap-link aap-eyebrow mt-1 text-[11px] text-mute hover:text-ink">
            {t("nav.signOut")}
          </button>
        </div>
      </div>
    </aside>
  );
}
