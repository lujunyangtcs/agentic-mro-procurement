import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronRight, ChevronLeft, ShoppingCart, Truck, Wrench, Lock } from "lucide-react";
import type { Product } from "@/Root";

/**
 * Single entry sign-in, set in the the reference site corporate idiom: a white bar with
 * a centred wordmark, one inset photograph, and a frosted panel laid over it.
 * The hero panel gives way to a single sign-in card with a role picker.
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
          src="/media/hero-plant.png"
          alt="Daylit assembly hall with a vehicle body on the line"
          className="aap-settle absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 transition-colors duration-500",
            phase === "hero" ? "bg-[rgb(12_18_28/0.08)]" : "bg-[rgb(12_18_28/0.5)]",
          )}
        />

        <div
          className={cn(
            "relative z-10 flex w-full items-center py-10",
            phase === "hero" ? "justify-end" : "justify-center",
          )}
        >
          {phase === "hero" ? <HeroPanel onEnter={() => setPhase("personas")} /> : <SignInPanel onPick={onPick} />}
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-5 sm:px-8">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {SITES.map((s, i) => (
            <li
              key={s}
              className="aap-eyebrow aap-fade-up text-mute"
              style={{ animationDelay: `${900 + i * 90}ms` }}
            >
              {s}
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}

function Wordmark() {
  return (
    <span className="aap-eyebrow inline-flex flex-col items-center text-center text-[13px] leading-[18px] text-ink">
      <span>Agentic Automotive</span>
      <span>Procurement</span>
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
      <p className="aap-eyebrow hidden text-mute md:block">Agentic procurement workforce</p>
      <div className="col-start-2">
        <Wordmark />
      </div>
      <div className="col-start-3 flex justify-end">
        {phase === "hero" ? (
          <button
            type="button"
            onClick={onEnter}
            className="ui-pill aap-cta inline-flex items-center gap-3 border border-ink bg-white px-6 py-3 text-[13px] text-ink"
          >
            Enter
            <ChevronRight size={16} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={onBack}
            className="ui-pill aap-cta group inline-flex items-center gap-3 border border-ink bg-white px-6 py-3 text-[13px] text-ink"
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
      className="aap-glass aap-fade-up mx-4 flex w-full max-w-[580px] flex-col px-8 py-10 sm:mx-0 sm:px-14 sm:py-14"
      style={{ animationDelay: "250ms" }}
    >
      <p className="aap-eyebrow text-mute">
        <span className="aap-line">
          <span style={{ animationDelay: "420ms" }}>Indirect procurement · four UK sites</span>
        </span>
      </p>
      <span aria-hidden className="aap-rule mt-5 block h-px w-16 bg-ink" style={{ animationDelay: "520ms" }} />
      <h1 id="entry-title" className="aap-title mt-5 text-[28px] leading-[36px] text-ink sm:text-[34px] sm:leading-[42px]">
        <span className="aap-line">
            <span style={{ animationDelay: "480ms" }}>Agentic</span>
          </span>
          <span className="aap-line">
            <span style={{ animationDelay: "560ms" }}>Automotive</span>
          </span>
        <span className="aap-line">
          <span style={{ animationDelay: "660ms" }}>Procurement</span>
        </span>
      </h1>
      <p
        className="aap-fade-up mt-6 text-pretty text-[16px] font-extralight leading-[28px] text-ink sm:text-[18px] sm:leading-[30px]"
        style={{ animationDelay: "820ms" }}
      >
        Maintenance parts, services, software and facilities for Solihull, Halewood, Wolverhampton and Gaydon. Each
        request is one case: approvals, orders and supplier work stay on its record.
      </p>
      <div className="aap-fade-up mt-9" style={{ animationDelay: "980ms" }}>
        <button
          type="button"
          onClick={onEnter}
          className="ui-pill aap-cta inline-flex items-center gap-4 bg-ink px-8 py-4 text-[13px] text-ink-inverse"
        >
          Sign in
          <ChevronRight size={17} aria-hidden />
        </button>
      </div>
    </section>
  );
}

function SignInPanel({ onPick }: { onPick: (p: Product, seat: "buyer" | "supplier") => void }) {
  const [seat, setSeat] = useState<Persona["seat"]>("buyer");
  const [pwd, setPwd] = useState("agentic-demo");
  const persona = PERSONAS.find((p) => p.seat === seat) ?? PERSONAS[0];
  const Icon = persona.icon;

  return (
    <div className="mx-4 flex w-full max-w-[460px] flex-col items-center gap-6">
      <div className="aap-fade-up flex flex-col items-center gap-3 text-center">
        <p className="aap-eyebrow text-ink-inverse/85">Choose your workspace</p>
        <h2 className="aap-title text-[30px] leading-[38px] text-ink-inverse">Sign in</h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onPick(persona.id, persona.seat);
        }}
        className="aap-glass aap-fade-up flex w-full flex-col gap-4 p-7"
        style={{ animationDelay: "140ms" }}
      >
        <div className="flex items-center justify-between gap-3">
          <span key={seat} className="aap-fade-up grid h-11 w-11 shrink-0 place-items-center border border-ink/25 text-ink">
            <Icon size={18} aria-hidden />
          </span>
          <span id="signin-as-label" className="aap-eyebrow border border-ink/20 px-3 py-1.5 text-[11px] text-mute">
            Sign in as
          </span>
        </div>

        <RoleSelect value={seat} onChange={setSeat} labelledBy="signin-as-label" />

        <Field icon={Lock} label="Password" name="password" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />

        <button
          type="submit"
          className="ui-pill aap-cta mt-1 inline-flex items-center justify-center gap-3 bg-ink px-5 py-4 text-[13px] text-ink-inverse"
        >
          Sign in
          <ChevronRight size={17} aria-hidden />
        </button>
      </form>

      <p className="aap-eyebrow text-center text-ink-inverse/80">Agents activate on sign-in · every action is audited</p>
    </div>
  );
}

/** Role picker built as a listbox so it can match the square glass styling. */
function RoleSelect({
  value,
  onChange,
  labelledBy,
}: {
  value: Persona["seat"];
  onChange: (seat: Persona["seat"]) => void;
  labelledBy: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    PERSONAS.findIndex((p) => p.seat === value),
  );
  const [active, setActive] = useState(selectedIndex);
  const selected = PERSONAS[selectedIndex];

  const openList = () => {
    setActive(selectedIndex);
    setOpen(true);
  };
  const choose = (i: number) => {
    onChange(PERSONAS[i].seat);
    setOpen(false);
  };

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="role-listbox"
        aria-labelledby={`${labelledBy} role-select-value`}
        aria-activedescendant={open ? `role-option-${PERSONAS[active].seat}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) return openList();
            const step = e.key === "ArrowDown" ? 1 : -1;
            setActive((i) => (i + step + PERSONAS.length) % PERSONAS.length);
          } else if ((e.key === "Enter" || e.key === " ") && open) {
            e.preventDefault();
            choose(active);
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            setOpen(false);
          }
        }}
        className={cn(
          "group flex w-full items-center justify-between gap-3 border bg-white/70 px-5 py-4 text-left transition-colors duration-150 ease-out",
          open ? "border-ink" : "border-ink/30 hover:border-ink",
        )}
      >
        <span id="role-select-value" className="flex min-w-0 flex-col">
          <span className="truncate text-[20px] font-light leading-[26px] text-ink">{selected.name}</span>
          <span className="aap-eyebrow truncate text-[10.5px] text-mute">{selected.badge}</span>
        </span>
        <ChevronDown
          size={18}
          aria-hidden
          className={cn("shrink-0 text-ink transition-transform duration-300 ease-out", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul
          id="role-listbox"
          role="listbox"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          className="aap-fade-up absolute inset-x-0 top-full z-20 mt-1 flex flex-col border border-ink/15 bg-white p-1 shadow-[0_18px_40px_-18px_rgb(12_18_28/0.45)]"
          style={{ animationDuration: "220ms" }}
        >
          {PERSONAS.map((p, i) => {
            const isSelected = i === selectedIndex;
            const OptionIcon = p.icon;
            return (
              <li
                key={p.seat}
                id={`role-option-${p.seat}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={cn(
                  "aap-nav-item flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 ease-out",
                  i === active ? "bg-surface-fog" : "bg-transparent",
                )}
              >
                <Check size={15} aria-hidden className={cn("shrink-0 text-ink", !isSelected && "invisible")} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] leading-[21px] text-ink">{p.name}</span>
                  <span className="truncate text-[12px] font-light leading-[17px] text-mute">{p.capabilities[0]}</span>
                </span>
                <OptionIcon size={16} aria-hidden className="shrink-0 text-steel" />
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
      <span aria-hidden className="aap-eyebrow shrink-0 text-[11px] text-mute">
        {label}
      </span>
    </label>
  );
}
