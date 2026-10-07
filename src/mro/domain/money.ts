import type { Pence } from "@/mro/domain/types";

const full = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/** Pounds (possibly fractional) to integer pence, rounded half away from zero. */
export function pence(pounds: number): Pence {
  return Math.sign(pounds) * Math.round(Math.abs(pounds) * 100);
}

/** Round a computed pence amount (e.g. after a percentage) back to whole pence. */
export function roundPence(value: number): Pence {
  return Math.sign(value) * Math.round(Math.abs(value));
}

export function lineTotal(unitPrice: Pence, quantity: number): Pence {
  return roundPence(unitPrice * quantity);
}

export function sumPence(values: Pence[]): Pence {
  return values.reduce((a, b) => a + b, 0);
}

/** The one money formatter: en-GB, GBP, always two decimals. Identical in every UI language. */
export function gbp(value: Pence): string {
  return full.format(value / 100);
}

/** Short form for tiles and chart axes: £480, £3.8K, £1.2M. */
export function gbpCompact(value: Pence): string {
  const pounds = value / 100;
  const abs = Math.abs(pounds);
  if (abs >= 1_000_000) return `£${trim(pounds / 1_000_000)}M`;
  if (abs >= 1_000) return `£${trim(pounds / 1_000)}K`;
  return `£${trim(pounds)}`;
}

function trim(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}
