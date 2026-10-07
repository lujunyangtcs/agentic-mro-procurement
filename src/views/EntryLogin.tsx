import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShoppingCart,
  Truck,
  Wrench,
  LogIn,
  Lock,
  User as UserIcon,
} from "lucide-react";
import type { Product } from "@/Root";

/**
 * Single entry sign-in for the agentic workforces. Same two-phase design as the
 * product logins (hero splash → sign-in), but the sign-in step shows three
 * persona cards by job title — MRO Buyer, Tactical Buyer and Freight Operations
 * Analyst — each with its own User ID / Password and a Sign-in button that
 * launches that workforce. (Receivables / O2C is kept in the codebase but is no
 * longer surfaced as a card.)
 */

/**
 * The three panels behind the sign-in.
 *
 * Each is a built treatment rather than a photograph: no licensing to clear,
 * nothing fetched at run time (corporate networks that block image hosts still
 * render it), and no real plant or product is ever depicted. `src` is honoured
 * when a panel is given a picture, so dropping three files into /public and
 * adding them here is the only change needed to switch to photography.
 */
type HeroColumn = {
  label: string;
  /** Optional photograph. When absent the built treatment below is used. */
  src?: string;
  /** Where to hold the crop, since a tall panel cuts a landscape photo hard. */
  focus?: string;
  /** Base, glow and lattice colours for the built treatment. */
  base: string;
  glow: string;
  accent: string;
};

const HERO_COLUMNS: HeroColumn[] = [
  {
    label: "Vehicle assembly",
    src: "/entry-assembly.png",
    base: "#07231f",
    glow: "#0f766e",
    accent: "#2dd4bf",
  },
  {
    label: "Maintenance stores",
    src: "/entry-stores.png",
    focus: "50% 45%",
    base: "#111827",
    glow: "#334155",
    accent: "#94a3b8",
  },
  {
    label: "Engineering services",
    src: "/entry-engineering.png",
    focus: "50% 55%",
    base: "#1b1206",
    glow: "#b45309",
    accent: "#fbbf24",
  },
];

/** A fine hexagonal lattice, drawn once and reused as a tiling background. */
const LATTICE =
  "url(\"data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='96' viewBox='0 0 56 96'>
       <g fill='none' stroke='white' stroke-width='1.1' stroke-opacity='0.5'>
         <path d='M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z'/>
         <path d='M28 64 L56 80 M28 64 L0 80'/>
       </g>
     </svg>`,
  ) +
  "\")";

type Persona = {
  id: Product;
  /** Which chair the workforce opens in — the buyer's desk or the supplier's. */
  seat: "buyer" | "supplier";
  icon: typeof ShoppingCart;
  badge: string;
  name: string;
  capabilities: string[];
  userId: string;
  /** Per-persona accent — the buyer teal, the supplier amber. */
  accent: { hex: string; halo: string };
};

const PERSONAS: Persona[] = [
  {
    id: "mro",
    seat: "buyer",
    icon: Wrench,
    badge: "Buy desk",
    name: "Buyer",
    capabilities: [
      "Free-text purchase requests structured & validated",
      "Master data, warranty, vendor & duplicate checks",
      "Every requisition released with a full audit trail",
    ],
    userId: "mrobuyer01",
    accent: { hex: "#14b8a6", halo: "rgba(20,184,166,0.45)" },
  },
  {
    id: "mro",
    seat: "supplier",
    icon: Truck,
    badge: "Supplier self service",
    name: "Supplier",
    capabilities: [
      "Orders, invoices and payments for your account",
      "Ask the assistant — it answers from the live records",
      "Anything commercial goes to a named person",
    ],
    userId: "supplier-ap-002",
    accent: { hex: "#f59e0b", halo: "rgba(245,158,11,0.45)" },
  },
];

export function EntryLogin({ onPick }: { onPick: (p: Product, seat: "buyer" | "supplier") => void }) {
  const [phase, setPhase] = useState<"hero" | "personas">("hero");

  return (
    <div className="fixed inset-0 overflow-auto bg-neutral-950 text-white">
      <HeroBackground heavyOverlay={phase === "personas"} />

      <div className="relative min-h-screen flex flex-col">
        <TopBar phase={phase} onSelect={() => setPhase("personas")} onBack={() => setPhase("hero")} />

        <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12 pt-6 sm:px-10">
          {phase === "hero" ? (
            <Hero onAccess={() => setPhase("personas")} />
          ) : (
            <SignInPanel onPick={onPick} />
          )}
        </main>

        <footer className="relative z-10 px-6 pb-7 text-center sm:px-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
            Demo environment · illustrative data
          </p>
        </footer>
      </div>
    </div>
  );
}

function HeroBackground({ heavyOverlay = false }: { heavyOverlay?: boolean }) {
  const colTint = heavyOverlay ? "bg-black/78" : "bg-black/62";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-3">
        {HERO_COLUMNS.map((col, i) => (
          <div
            key={col.label}
            className="relative overflow-hidden"
            style={{ animation: `entry-panel-in 900ms cubic-bezier(0.22,1,0.36,1) ${i * 140}ms both` }}
          >
            {col.src ? (
              <div
                className="absolute inset-0 bg-cover"
                style={{
                  backgroundImage: `url('${col.src}')`,
                  backgroundPosition: col.focus ?? "center",
                  animation: `entry-photo-in 2600ms cubic-bezier(0.22,1,0.36,1) ${i * 140}ms both`,
                }}
              />
            ) : (
              <>
                {/* Depth: a deep base, then two broad glows offset from each other. */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `
                      radial-gradient(120% 68% at 50% 100%, ${col.glow}e6 0%, transparent 66%),
                      radial-gradient(78% 44% at 22% -8%, ${col.accent}30 0%, transparent 68%),
                      linear-gradient(178deg, ${col.base} 0%, #05070a 100%)`,
                  }}
                />
                {/* A fine lattice, fading out as it rises. */}
                <div
                  className="absolute inset-0 opacity-[0.16]"
                  style={{
                    backgroundImage: LATTICE,
                    backgroundSize: "56px 96px",
                    maskImage: "linear-gradient(to top, black 5%, transparent 78%)",
                    WebkitMaskImage: "linear-gradient(to top, black 5%, transparent 78%)",
                  }}
                />
                {/* A single soft band, like light across a polished surface. */}
                <div
                  className="absolute inset-x-0 h-[42%] bottom-[18%]"
                  style={{
                    background: `linear-gradient(103deg, transparent 12%, ${col.accent}1f 47%, transparent 82%)`,
                    filter: "blur(26px)",
                  }}
                />
              </>
            )}
            {/* Photographs need holding back hard; the built panels are already
                dark, so they only get enough tint to seat the sign-in card. */}
            <div
              className={cn(
                "absolute inset-0 transition-colors duration-500",
                col.src ? colTint : heavyOverlay ? "bg-black/45" : "bg-black/5",
              )}
            />
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
            {!heavyOverlay && (
              <span
                className="absolute inset-x-0 bottom-20 z-10 px-2 text-center text-[12px] font-bold uppercase tracking-[0.28em] text-white/70"
                style={{ animation: `entry-rise 700ms ease-out ${700 + i * 140}ms both` }}
              >
                {col.label}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-1/3 w-px bg-white/10" />
      <div className="absolute inset-y-0 left-2/3 w-px bg-white/10" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 46% at 50% 46%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.34) 46%, transparent 78%)",
        }}
      />
    </div>
  );
}

function TopBar({
  phase,
  onSelect,
  onBack,
}: {
  phase: "hero" | "personas";
  onSelect: () => void;
  onBack: () => void;
}) {
  return (
    <header className="relative z-20 flex w-full items-center justify-between px-6 py-5 sm:px-10">
      <div className="inline-flex items-center gap-3">
        <span className="grid w-10 h-10 place-items-center rounded-xl border border-teal-400/45 bg-teal-400/15 text-teal-300">
          <Sparkles size={16} strokeWidth={2} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-[-0.01em] text-white">Automotive Procurement</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
            Demo environment
          </span>
        </span>
      </div>

      {phase === "hero" ? (
        <button
          type="button"
          onClick={onSelect}
          className="ui-pill group inline-flex items-center gap-2 rounded-md border border-white/35 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.20em] text-white/85 transition-all duration-300 hover:border-teal-400 hover:bg-teal-400/[0.08] hover:text-teal-300"
        >
          Enter
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onBack}
          className="ui-pill group inline-flex items-center gap-2 rounded-md border border-white/35 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.20em] text-white/85 transition-all duration-300 hover:border-white/60 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
      )}
    </header>
  );
}

function Hero({ onAccess }: { onAccess: () => void }) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center">
      <span
        className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        style={{ animation: "entry-rise 700ms ease-out 260ms both" }}
      >
        Indirect procurement · four UK sites
      </span>
      <h1
        className="font-bold leading-[1.04] tracking-[-0.025em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]"
        style={{
          fontSize: "clamp(2rem, 5.6vw, 4.4rem)",
          animation: "entry-rise 800ms cubic-bezier(0.22,1,0.36,1) 380ms both",
        }}
      >
        Automotive Procurement
      </h1>
      <p
        className="mt-6 max-w-xl text-[14px] font-normal leading-[1.55] text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-[15px]"
        style={{ animation: "entry-rise 800ms ease-out 520ms both" }}
      >
        Maintenance parts, services, software and facilities for Solihull, Halewood,
        Wolverhampton and Gaydon. Each request is one case: approvals, orders and
        supplier work stay on its record.
      </p>
      <button
        type="button"
        onClick={onAccess}
        style={{ animation: "entry-rise 800ms ease-out 660ms both" }}
        className="ui-pill group mt-8 inline-flex items-center gap-3 rounded-md bg-teal-400 px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.22em] text-neutral-950 transition-all duration-300 hover:bg-teal-300 hover:shadow-[0_0_36px_rgba(45,212,191,0.45)] active:scale-[0.97]"
      >
        Sign in
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

function SignInPanel({ onPick }: { onPick: (p: Product, seat: "buyer" | "supplier") => void }) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[1080px]">
      <div className="text-center mb-8" style={{ animation: "entry-rise 620ms ease-out both" }}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          Choose your workspace
        </span>
        <h2
          className="mt-3 font-bold leading-[1.05] tracking-[-0.02em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]"
          style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)" }}
        >
          Sign in
        </h2>
      </div>

      <div className="mx-auto grid max-w-[760px] gap-4 md:grid-cols-2">
        {PERSONAS.map((p, i) => (
          <PersonaCard key={p.seat} persona={p} onPick={onPick} index={i} />
        ))}
      </div>

      <p className="mt-8 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
        Agents activate on sign-in · every action is audited
      </p>
    </div>
  );
}

function PersonaCard({
  persona,
  onPick,
  index,
}: {
  persona: Persona;
  onPick: (p: Product, seat: "buyer" | "supplier") => void;
  index: number;
}) {
  const [user, setUser] = useState(persona.userId);
  const [pwd, setPwd] = useState("agentic-demo");
  const Icon = persona.icon;
  const ACCENT = persona.accent;

  return (
    <article
      style={{
        boxShadow: `inset 0 0 0 1px ${ACCENT.hex}33, 0 25px 70px -30px ${ACCENT.halo}`,
        animation: `entry-card-in 620ms cubic-bezier(0.22,1,0.36,1) ${120 + index * 130}ms both`,
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-25 blur-3xl"
        style={{ background: ACCENT.hex }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <span className="grid w-10 h-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-white/85">
          <Icon size={16} strokeWidth={1.75} />
        </span>
        <span
          className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: ACCENT.hex, background: `${ACCENT.hex}14`, border: `1px solid ${ACCENT.hex}55` }}
        >
          {persona.badge}
        </span>
      </div>

      <h3 className="relative mt-5 text-[19px] font-bold leading-[1.15] tracking-[-0.015em] text-white">
        {persona.name}
      </h3>

      <ul className="relative mt-4 space-y-2">
        {persona.capabilities.map((cap) => (
          <li key={cap} className="flex items-start gap-2.5 text-[12.5px] leading-[1.5] text-white/80">
            <span aria-hidden className="mt-[6px] block w-1.5 h-1.5 shrink-0 rounded-full" style={{ background: ACCENT.hex }} />
            <span>{cap}</span>
          </li>
        ))}
      </ul>

      <div
        className="relative my-5 h-px w-full"
        style={{ background: `linear-gradient(to right, transparent, ${ACCENT.hex}55, transparent)` }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onPick(persona.id, persona.seat);
        }}
        className="relative mt-auto flex flex-col gap-2"
      >
        <Field icon={UserIcon} label="User ID" name={`${persona.id}-user`} value={user} onChange={(e) => setUser(e.target.value)} />
        <Field icon={Lock} label="Password" name={`${persona.id}-pwd`} type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
        <button
          type="submit"
          style={{ background: ACCENT.hex }}
          className="ui-pill mt-3 inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-[12px] font-bold uppercase tracking-[0.22em] text-neutral-950 transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
        >
          <LogIn size={14} />
          Sign in
        </button>
      </form>
    </article>
  );
}

function Field({
  icon: Icon,
  label,
  ...rest
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="group relative flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 transition-colors duration-200 focus-within:bg-white/[0.07] focus-within:border-white/40">
      <Icon size={14} strokeWidth={1.8} className="text-white/55 shrink-0" />
      <input
        {...rest}
        className="flex-1 bg-transparent text-[13px] font-medium tracking-[0.02em] text-white placeholder-white/40 outline-none"
      />
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 shrink-0">
        {label}
      </span>
    </label>
  );
}
