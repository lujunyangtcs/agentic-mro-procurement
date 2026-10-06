/**
 * One icon vocabulary for the whole workspace.
 *
 * Held centrally rather than chosen per page, so the same idea always carries
 * the same glyph: money is always a note, a hold is always a pause, anything
 * the workforce did without a person is always the bolt. All outline, all one
 * stroke weight, all one size — mixing weights or filled-and-outline at the
 * same level is what makes an interface look assembled rather than designed.
 */

import {
  FileText,
  Hand,
  Zap,
  CircleAlert,
  Banknote,
  ShieldCheck,
  CircleCheck,
  Ruler,
  Copy,
  Warehouse,
  BadgeCheck,
  FileX2,
  Scale,
  ReceiptText,
  TriangleAlert,
  HandCoins,
  MessageSquare,
  Bot,
  Clock,
  UserCheck,
  PauseCircle,
  Building2,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { ExceptionType } from "@/mro/data/procurement";

/** The size tokens. Nothing in the workspace picks its own number. */
export const ICON = {
  /** Inside a 40px tinted square on a stat tile. */
  tile: 17,
  /** Inline with a row of 13px text. */
  row: 15,
  /** Stroke weight, everywhere. */
  stroke: 1.75,
} as const;

/** Renders a glyph at the tile size, so tiles never drift apart. */
export function TileIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon size={ICON.tile} strokeWidth={ICON.stroke} />;
}

/* ── Per-surface vocabulary ─────────────────────────────────────────────── */

export const icons = {
  /* Requisitions */
  requisitions: FileText,
  held: Hand,
  touchless: Zap,

  /* Exceptions */
  exception: CircleAlert,
  money: Banknote,
  protected: ShieldCheck,
  decided: CircleCheck,

  /* Invoice matching */
  invoice: ReceiptText,
  disagree: TriangleAlert,
  recoverable: HandCoins,

  /* Service desk and supplier self service */
  question: MessageSquare,
  assistant: Bot,
  waiting: Clock,
  answered: UserCheck,
  onHold: PauseCircle,
  beingPaid: HandCoins,

  /* Control tower */
  supplier: Building2,
  risk: ShieldAlert,
} satisfies Record<string, LucideIcon>;

/** One glyph per reason a requisition stopped, shared by tiles, rows and detail. */
export const exceptionIcon: Record<ExceptionType, LucideIcon> = {
  "spec-incomplete": Ruler,
  "duplicate-demand": Copy,
  "stock-available": Warehouse,
  "warranty-covered": BadgeCheck,
  "off-contract": FileX2,
  "over-threshold": Scale,
};
