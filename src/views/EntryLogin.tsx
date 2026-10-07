import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, ShoppingCart, Truck, Wrench, Lock, User as UserIcon } from "lucide-react";
import type { Product } from "@/Root";

/**
 * Single entry sign-in, set in the jlr.com corporate idiom: a white bar with
 * a centred wordmark, one inset photograph, and a frosted panel laid over it.
 * The hero panel gives way to the two sign-in cards on the same photograph.
 */

type Persona = {
  id: Product;
  /** Which chair the workforce opens in — the buyer's desk or the supplier's. */
  seat: "buyer" | "supplier";
  icon: typeof ShoppingCart;
  badge: string;
  name: string;
  capabilities: string[];
  userId: string;
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
  },
];

const SITES = ["Solihull", "Halewood", "Wolverhampton", "Gaydon"];

export function EntryLogin({ onPick }: { onPick: (p: Product, seat: "buyer" | "supplier") => void }) {
  const [phase, setPhase] = useState<"hero" | "personas">("hero");

  return (
    <div className="fixed inset-0 flex flex-col overflow-auto bg-background font-sans text-ink">
      <TopBar phase={phase} onEnter={() => setPhase("personas")} onBack={() => setPhase("hero")} />

      <main className="relative mx-3 flex min-h-[620px] flex-1 overflow-hidden sm:mx-5">
        <img
          src="/jlr/hero-plant.png"
          alt="Daylit assembly hall with a vehicle body on the line"
          className="jlr-settle absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 transition-colors duration-500",
            phase === "hero" ? "bg-[rgb(12_18_28/0.08)]" : "bg-[rgb(12_18_28/0.5)]",
          )}
        />

        <div className="relative z-10 flex w-full items-center justify-end py-10">
          {phase === "hero" ? <HeroPanel onEnter={() => setPhase("personas")} /> : <SignInPanel onPick={onPick} />}
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-5 sm:px-8">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {SITES.map((s, i) => (
            <li
              key={s}
              className="jlr-eyebrow jlr-fade-up text-mute"
              style={{ animationDelay: `${900 + i * 90}ms` }}
            >
              {s}
            </li>
          ))}
        </ul>
        <p className="jlr-eyebrow text-steel">Demo environment · illustrative data</p>
      </footer>
    </div>
  );
}

function Wordmark() {
  return (
    <span className="inline-flex items-center gap-3 text-ink" aria-label="Indirect Procurement">
      <span className="text-[30px] font-extralight leading-none tracking-[-0.04em]">JLR</span>
      <span aria-hidden className="h-7 w-px bg-ink/30" />
      <span className="jlr-eyebrow leading-tight text-ink">
        Indirect
        <br />
        Procurement
      </span>
    </span>
  );
}

function TopBar({
  phase,
  onEnter,
  onBack,
}: {
  phase: "hero" | "personas";
  onEnter: () => void;
  onBack: () => void;
}) {
  return (
    <header className="relative grid h-[88px] shrink-0 grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8">
      <p className="jlr-eyebrow hidden text-mute md:block">Agentic procurement workforce</p>
      <div className="col-start-2">
        <Wordmark />
      </div>
      <div className="col-start-3 flex justify-end">
        {phase === "hero" ? (
          <button
            type="button"
            onClick={onEnter}
            className="ui-pill jlr-cta inline-flex items-center gap-3 border border-ink bg-white px-6 py-3 text-[13px] text-ink"
          >
            Enter
            <ChevronRight size={16} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={onBack}
            className="ui-pill jlr-cta group inline-flex items-center gap-3 border border-ink bg-white px-6 py-3 text-[13px] text-ink"
          >
            <ChevronLeft size={16} aria-hidden className="transition-transform duration-150 ease-out group-hover:-translate-x-1" />
            Back
          </button>
        )}
      </div>
    </header>
  );
}

function HeroPanel({ onEnter }: { onEnter: () => void }) {
  return (
    <section
      aria-labelledby="entry-title"
      className="jlr-glass jlr-fade-up mx-4 flex w-full max-w-[580px] flex-col px-8 py-10 sm:mx-0 sm:px-14 sm:py-14"
      style={{ animationDelay: "250ms" }}
    >
      <p className="jlr-eyebrow text-mute">
        <span className="jlr-line">
          <span style={{ animationDelay: "420ms" }}>Indirect procurement · four UK sites</span>
        </span>
      </p>
      <span aria-hidden className="jlr-rule mt-5 block h-px w-16 bg-ink" style={{ animationDelay: "520ms" }} />
      <h1 id="entry-title" className="jlr-title mt-5 text-[28px] leading-[36px] text-ink sm:text-[34px] sm:leading-[42px]">
        <span className="jlr-line">
          <span style={{ animationDelay: "560ms" }}>Automotive</span>
        </span>
        <span className="jlr-line">
          <span style={{ animationDelay: "660ms" }}>Procurement</span>
        </span>
      </h1>
      <p
        className="jlr-fade-up mt-6 text-pretty text-[16px] font-extralight leading-[28px] text-ink sm:text-[18px] sm:leading-[30px]"
        style={{ animationDelay: "820ms" }}
      >
        Maintenance parts, services, software and facilities for Solihull, Halewood, Wolverhampton and Gaydon. Each
        request is one case: approvals, orders and supplier work stay on its record.
      </p>
      <div className="jlr-fade-up mt-9" style={{ animationDelay: "980ms" }}>
        <button
          type="button"
          onClick={onEnter}
          className="ui-pill jlr-cta inline-flex items-center gap-4 bg-ink px-8 py-4 text-[13px] text-ink-inverse"
        >
          Sign in
          <ChevronRight size={17} aria-hidden />
        </button>
      </div>
    </section>
  );
}

function SignInPanel({ onPick }: { onPick: (p: Product, seat: "buyer" | "supplier") => void }) {
  return (
    <div className="mx-4 flex w-full max-w-[880px] flex-col gap-5 sm:mx-10 lg:mr-14">
      <div className="jlr-fade-up flex flex-col gap-2">
        <p className="jlr-eyebrow text-ink-inverse/85">Choose your workspace</p>
        <h2 className="jlr-title text-[28px] leading-[36px] text-ink-inverse">Sign in</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {PERSONAS.map((p, i) => (
          <PersonaCard key={p.seat} persona={p} onPick={onPick} index={i} />
        ))}
      </div>
      <p className="jlr-eyebrow text-ink-inverse/80">Agents activate on sign-in · every action is audited</p>
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

  return (
    <article
      className="jlr-glass jlr-fade-up flex flex-col p-7"
      style={{ animationDelay: `${140 + index * 140}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center border border-ink/25 text-ink">
          <Icon size={18} aria-hidden />
        </span>
        <span className="jlr-eyebrow text-mute">{persona.badge}</span>
      </div>

      <h3 className="jlr-title mt-6 text-[22px] leading-[28px] text-ink">{persona.name}</h3>
      <span aria-hidden className="jlr-rule mt-4 block h-px w-12 bg-ink" style={{ animationDelay: `${420 + index * 140}ms` }} />

      <ul className="mt-5 flex flex-col gap-2.5">
        {persona.capabilities.map((cap) => (
          <li key={cap} className="flex items-start gap-2.5 text-[13.5px] font-light leading-[20px] text-ink">
            <ChevronRight size={14} aria-hidden className="mt-[3px] shrink-0 text-steel" />
            <span>{cap}</span>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onPick(persona.id, persona.seat);
        }}
        className="mt-7 flex flex-col gap-3"
      >
        <Field icon={UserIcon} label="User ID" name={`${persona.seat}-user`} value={user} onChange={(e) => setUser(e.target.value)} />
        <Field
          icon={Lock}
          label="Password"
          name={`${persona.seat}-pwd`}
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <button
          type="submit"
          className="ui-pill jlr-cta mt-3 inline-flex items-center justify-between gap-2 bg-sand px-5 py-3.5 text-[13px] text-ink hover:bg-sand-deep"
        >
          Sign in as {persona.name}
          <ChevronRight size={17} aria-hidden />
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
  icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={cn(
        "group flex items-center gap-3 border-b border-ink/30 pb-2 transition-colors duration-150",
        "focus-within:border-ink",
      )}
    >
      <Icon size={15} aria-hidden className="shrink-0 text-steel" />
      <span className="sr-only">{label}</span>
      <input
        {...rest}
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent text-[14px] font-light text-ink outline-none placeholder:text-mute"
      />
      <span aria-hidden className="jlr-eyebrow shrink-0 text-[11px] text-mute">
        {label}
      </span>
    </label>
  );
}
