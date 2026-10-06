import * as React from "react";
import { cn } from "@/mro/lib/utils";
import { useApp, type View } from "@/mro/state";
import { useT } from "@/mro/lib/i18n";
import { agentsById, type AgentId } from "@/mro/data/agents";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  FileText,
  CircleAlert,
  Receipt,
  Headset,
  MessageSquare,
  Globe,
} from "lucide-react";

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
const buyerSectionsFor = (t: (key: string) => string): Section[] => [
  {
    title: t("nav.overview"),
    items: [
      { label: t("nav.dashboard"), icon: LayoutDashboard, view: { kind: "cockpit" } },
      { label: t("nav.controlTower"), icon: Globe, view: { kind: "control-tower" } },
      { ...agentItem("orchestrator"), label: t("nav.agentWorkforce") },
    ],
  },
  {
    /* The buyer's own desk — the work, rather than the workforce. */
    title: t("nav.myDesk"),
    items: [
      { label: t("nav.requisitions"), icon: FileText, view: { kind: "requisitions" } },
      { label: t("nav.exceptions"), icon: CircleAlert, view: { kind: "exceptions" } },
      { label: t("nav.invoiceMatching"), icon: Receipt, view: { kind: "invoice-matching" } },
      { label: t("nav.serviceDesk"), icon: Headset, view: { kind: "service-desk" } },
    ],
  },
  {
    title: t("nav.validation"),
    items: [
      { ...agentItem("intake"), label: t("nav.prProcessing") },
      { ...agentItem("vendor"), label: t("nav.masterData") },
      { ...agentItem("invoice"), label: t("nav.warranty") },
      { ...agentItem("sourcing"), label: t("nav.sourcing") },
      { ...agentItem("po"), label: t("nav.approval") },
    ],
  },
  {
    title: t("nav.system"),
    items: [
      { label: t("nav.auditLog"), icon: ClipboardList, comingSoon: true },
      { label: t("nav.settings"), icon: Settings, comingSoon: true },
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
  if (item.view.kind === "cockpit") return view.kind === "cockpit";
  if (item.view.kind === "agent") return view.kind === "agent" && view.id === item.view.id;
  if (item.view.kind === "requisitions") return view.kind === "requisitions";
  if (item.view.kind === "exceptions") return view.kind === "exceptions";
  if (item.view.kind === "invoice-matching") return view.kind === "invoice-matching";
  if (item.view.kind === "service-desk") return view.kind === "service-desk";
  if (item.view.kind === "supplier-center") return view.kind === "supplier-center";
  if (item.view.kind === "supplier-overview") return view.kind === "supplier-overview";
  if (item.view.kind === "control-tower") return view.kind === "control-tower";
  return false;
}

export function Sidebar() {
  const { view, go, signOut, persona } = useApp();
  const { t } = useT();
  const isSupplier = persona === "supplier";
  const sectionsForPersona = isSupplier ? supplierSectionsFor(t) : buyerSectionsFor(t);

  return (
    <aside className="flex flex-col w-[240px] shrink-0 h-screen bg-white border-r border-divider sticky top-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-deep flex items-center justify-center">
            <span className="text-ink-inverse text-[15px] leading-none font-bold">✦</span>
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-bold text-ink">
              {isSupplier ? t("sp.chip") : "MRO procurement"}
            </div>
            <div className="text-[12px] text-mute">
              {isSupplier ? "Apex Industrial Supply" : "Bond"}
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto pt-3">
        {sectionsForPersona.map((section) => (
          <div key={section.title} className="pb-3">
            <div className="px-5 pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-mute">
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
                      className={cn(
                        "ui-pill w-full flex items-center gap-2.5 px-5 py-1.5 text-[13px] text-left",
                        "border-l-4 border-transparent",
                        isActive && "bg-surface-mint border-surface-deep text-surface-deep font-medium",
                        !isActive && !item.comingSoon && "text-ink hover:bg-surface-mint/40",
                        item.comingSoon && "text-mute cursor-not-allowed",
                      )}
                    >
                      <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge?.kind === "star" && (
                        <span className="text-surface-deep text-[12px]">★</span>
                      )}
                      {item.badge?.kind === "count" && (
                        <span className="text-[11px] rounded-full bg-surface-fog text-mute px-1.5 py-0.5">
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
      <div className="px-4 pb-4 pt-1 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-surface-deep flex items-center justify-center text-[12px] font-bold text-ink-inverse">
          {isSupplier ? "AR" : "PB"}
        </div>
        <div className="leading-tight flex-1 min-w-0">
          <div className="text-[13px] text-ink truncate">
            {isSupplier ? "Apex · accounts receivable" : "Procurement · MRO buyer desk"}
          </div>
          <button type="button" onClick={signOut} className="text-[12px] text-mute hover:text-ink">
            {t("nav.signOut")}
          </button>
        </div>
      </div>
    </aside>
  );
}
