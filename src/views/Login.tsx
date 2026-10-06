import { useState } from "react";
import { useApp } from "@/state";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Boxes,
  Lock,
  User as UserIcon,
  LogIn,
} from "lucide-react";

// Tri-panel hero photography — manufacturing & procurement imagery, served
// locally from /public so the page works on corporate networks that block
// remote image CDNs.
const HERO_COLUMNS = [
  { label: "Sourcing & Spot-Buy", src: "/hero-factory.jpg" },
  { label: "Orders & delivery", src: "/hero-boxes.jpg" },
  { label: "Invoices & Suppliers", src: "/hero-paper.jpg" },
];

const ACCENT = { hex: "#14b8a6", halo: "rgba(20,184,166,0.45)" };

const PERSONA = {
  badge: "Procurement Ops",
  name: "Procurement workspace",
  capabilities: [
    "One cockpit over 5 agents and the orchestrator",
    "Touchless orders within policy · approvals only when it matters",
    "Every order issued with a full audit trail",
  ],
  userId: "buyer01",
};

export function Login({ onExit }: { onExit?: () => void }) {
  const { signIn } = useApp();
  const [phase, setPhase] = useState<"hero" | "personas">("hero");

  return (
    <div className="fixed inset-0 overflow-auto bg-neutral-950 text-white">
      <HeroBackground heavyOverlay={phase === "personas"} />
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="absolute top-4 left-1/2 z-30 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75 backdrop-blur transition-colors hover:border-teal-400 hover:text-teal-300"
        >
          <ArrowLeft size={13} /> All workforces
        </button>
      )}

      <div className="relative min-h-screen flex flex-col">
        <TopBar phase={phase} onSelect={() => setPhase("personas")} onBack={() => setPhase("hero")} />

        <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12 pt-6 sm:px-10">
          {phase === "hero" ? (
            <Hero onAccess={() => setPhase("personas")} />
          ) : (
            <SignInPanel signIn={signIn} />
          )}
        </main>

        <footer className="relative z-10 px-6 pb-7 text-center sm:px-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
            Confidential · Enterprise Use Only
          </p>
        </footer>
      </div>
    </div>
  );
}

function HeroBackground({ heavyOverlay = false }: { heavyOverlay?: boolean }) {
  const colTint = heavyOverlay ? "bg-black/68" : "bg-black/48";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-3">
        {HERO_COLUMNS.map((col) => (
          <div key={col.label} className="relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${col.src}')` }}
            />
            <div className={cn("absolute inset-0 transition-colors duration-500", colTint)} />
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
            {!heavyOverlay && (
              <span className="absolute inset-x-0 bottom-20 z-10 text-center text-[11px] font-bold uppercase tracking-[0.32em] text-white/60">
                {col.label}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-1/3 w-px bg-white/10" />
      <div className="absolute inset-y-0 left-2/3 w-px bg-white/10" />
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
          <span className="text-[15px] font-bold tracking-[-0.01em] text-white">
            Agentic Procure-to-Pay
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
            Multi-agent procurement workforce
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
      <span className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
        Global procurement intelligence
      </span>
      <h1
        className="font-bold leading-[1.04] tracking-[-0.025em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]"
        style={{ fontSize: "clamp(2rem, 5.6vw, 4.4rem)" }}
      >
        Agentic Procure-to-Pay
      </h1>
      <p className="mt-6 max-w-xl text-[14px] font-normal leading-[1.55] text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-[15px]">
        Turn requests into requisitions, run spot tenders, draft and check
        orders, route the ones that need a person, and issue them with a
        complete audit trail.
      </p>
      <button
        type="button"
        onClick={onAccess}
        className="ui-pill group mt-8 inline-flex items-center gap-3 rounded-md bg-teal-400 px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.22em] text-neutral-950 transition-all duration-300 hover:bg-teal-300 active:scale-[0.97]"
      >
        Open the cockpit
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

function SignInPanel({ signIn }: { signIn: () => void }) {
  const [user, setUser] = useState(PERSONA.userId);
  const [pwd, setPwd] = useState("agentic-demo");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn();
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-[440px]">
      <div className="text-center mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          Procurement workspace
        </span>
        <h2
          className="mt-3 font-bold leading-[1.05] tracking-[-0.02em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]"
          style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)" }}
        >
          Sign in
        </h2>
      </div>

      <article
        style={{
          boxShadow: `inset 0 0 0 1px ${ACCENT.hex}33, 0 25px 70px -30px ${ACCENT.halo}`,
        }}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white backdrop-blur-xl"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-25 blur-3xl"
          style={{ background: ACCENT.hex }}
        />

        <div className="relative flex items-center justify-between gap-3">
          <span className="grid w-10 h-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-white/85">
            <Boxes size={16} strokeWidth={1.75} />
          </span>
          <span
            className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: ACCENT.hex, background: `${ACCENT.hex}14`, border: `1px solid ${ACCENT.hex}55` }}
          >
            {PERSONA.badge}
          </span>
        </div>

        <h3 className="relative mt-5 text-[19px] font-bold leading-[1.15] tracking-[-0.015em] text-white">
          {PERSONA.name}
        </h3>

        <ul className="relative mt-4 space-y-2">
          {PERSONA.capabilities.map((cap) => (
            <li key={cap} className="flex items-start gap-2.5 text-[12.5px] leading-[1.5] text-white/80">
              <span
                aria-hidden
                className="mt-[6px] block w-1.5 h-1.5 shrink-0 rounded-full"
                style={{ background: ACCENT.hex }}
              />
              <span>{cap}</span>
            </li>
          ))}
        </ul>

        <div
          className="relative my-5 h-px w-full"
          style={{ background: `linear-gradient(to right, transparent, ${ACCENT.hex}55, transparent)` }}
        />

        <form onSubmit={handleSubmit} className="relative flex flex-col gap-2">
          <Field icon={UserIcon} label="User ID" name="buyer-user" value={user} onChange={(e) => setUser(e.target.value)} />
          <Field icon={Lock} label="Password" name="buyer-pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
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

      <p className="mt-8 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
        Agents activate on sign-in · every action is audited
      </p>
    </div>
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
