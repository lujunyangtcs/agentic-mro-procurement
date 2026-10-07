import * as React from "react";
import P2pApp from "@/App";
import O2cApp from "@/o2c/App";
import FreightApp from "@/freight/App";
import MroApp from "@/mro/App";
import { EntryLogin } from "@/views/EntryLogin";
import { ProcurementStoreProvider } from "@/mro/data/store";
import { loadNav } from "@/mro/state";

export type Product = "p2p" | "o2c" | "freight" | "mro";

/**
 * The MRO workforce behind one sign-in, entered from either chair. The entry
 * shows two cards — Buyer and Supplier — and picking one signs into that seat.
 * There is no persona switch inside the workspace on purpose: changing chairs
 * means signing out and coming back through the door, the way a real person
 * would. Signing out returns here.
 *
 * The P2P, O2C and Freight workforces stay wired for reuse but are not shown.
 */
function Launched() {
  /* A refresh inside the workspace resumes the seat and screen it was on. */
  const [resumed] = React.useState(loadNav);
  const [launched, setLaunched] = React.useState<Product | null>(resumed ? "mro" : null);
  const [seat, setSeat] = React.useState<"buyer" | "supplier">(resumed?.persona ?? "buyer");
  const back = () => setLaunched(null);

  if (launched === "p2p") return <P2pApp startSignedIn onExit={back} />;
  if (launched === "o2c") return <O2cApp startSignedIn onExit={back} />;
  if (launched === "freight") return <FreightApp startSignedIn onExit={back} />;
  if (launched === "mro") return <MroApp startSignedIn startPersona={seat} onExit={back} />;
  return (
    <EntryLogin
      onPick={(product, chosenSeat) => {
        setSeat(chosenSeat);
        setLaunched(product);
      }}
    />
  );
}

export function Root() {
  /**
   * The records sit above the door. Changing chairs means signing out and
   * coming back in, which unmounts the workspace entirely — so if the store
   * lived inside it, the questions a supplier had just asked would be gone by
   * the time the buyer sat down to answer them.
   */
  return (
    <ProcurementStoreProvider>
      <Launched />
    </ProcurementStoreProvider>
  );
}
