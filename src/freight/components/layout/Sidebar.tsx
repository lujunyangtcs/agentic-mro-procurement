import * as React from "react";
import { cn } from "@/freight/lib/utils";
import { useApp, type View } from "@/freight/state";
import { agentsById, type AgentId } from "@/freight/data/agents";
import { LayoutDashboard, ClipboardList, Settings } from "lucide-react";

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

const sections: Section[] = [
  {
    title: "Overview",
    items: [
      { label: "Cockpit", icon: LayoutDashboard, view: { kind: "cockpit" } },
      agentItem("orchestrator"),
    ],
  },
  {
    title: "Procurement",
    items: [
      agentItem("intake"),
      agentItem("sourcing"),
      agentItem("po"),
      agentItem("invoice"),
    ],
  },
  {
    title: "Master data",
    items: [agentItem("vendor")],
  },
  {
    title: "System",
    items: [
      { label: "Audit log", icon: ClipboardList, comingSoon: true },
      { label: "Settings", icon: Settings, comingSoon: true },
    ],
  },
];

function isItemActive(item: NavItem, view: View): boolean {
  if (!item.view) return false;
  if (item.view.kind === "cockpit") return view.kind === "cockpit";
  if (item.view.kind === "agent") return view.kind === "agent" && view.id === item.view.id;
  return false;
}

export function Sidebar() {
  const { view, go, signOut } = useApp();

  return (
    <aside className="flex flex-col w-[240px] shrink-0 h-screen bg-white border-r border-divider sticky top-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-deep flex items-center justify-center">
            <span className="text-ink-inverse text-[15px] leading-none font-bold">✦</span>
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-bold text-ink">Freight settlement</div>
            <div className="text-[12px] text-mute">Northgate Paper Co.</div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto pt-3">
        {sections.map((section) => (
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
                      {item.comingSoon && <span className="text-[11px] text-mute">Soon</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Persona footer */}
      <div className="px-4 py-4 border-t border-divider flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-surface-deep flex items-center justify-center text-[12px] font-bold text-ink-inverse">
          FO
        </div>
        <div className="leading-tight flex-1 min-w-0">
          <div className="text-[13px] text-ink truncate">Freight Ops · settlement desk</div>
          <button type="button" onClick={signOut} className="text-[11px] text-mute hover:text-ink">
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
