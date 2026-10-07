import type { IsoTime } from "@/mro/domain/types";

/** 7 October 2026, 09:00 Europe/London (BST, UTC+1). */
export const CLOCK_START: IsoTime = "2026-10-07T08:00:00.000Z";

const MINUTE = 60_000;

export function addMinutes(at: IsoTime, minutes: number): IsoTime {
  return new Date(Date.parse(at) + minutes * MINUTE).toISOString();
}

export function addHours(at: IsoTime, hours: number): IsoTime {
  return addMinutes(at, hours * 60);
}

type DisplayLang = "en" | "de";

const LOCALE: Record<DisplayLang, string> = { en: "en-GB", de: "de-DE" };

const DATE_PARTS = { timeZone: "Europe/London", day: "2-digit", month: "short", year: "numeric" } as const;

const dateTime: Record<DisplayLang, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat(LOCALE.en, { ...DATE_PARTS, hour: "2-digit", minute: "2-digit", hour12: false }),
  de: new Intl.DateTimeFormat(LOCALE.de, { ...DATE_PARTS, hour: "2-digit", minute: "2-digit", hour12: false }),
};

const dateOnly: Record<DisplayLang, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat(LOCALE.en, DATE_PARTS),
  de: new Intl.DateTimeFormat(LOCALE.de, DATE_PARTS),
};

/** "07 Oct 2026, 09:00" — London wall time, regardless of the viewer's zone. */
export function londonDateTime(at: IsoTime, lang: DisplayLang = "en"): string {
  return dateTime[lang].format(new Date(at));
}

export function londonDate(at: IsoTime, lang: DisplayLang = "en"): string {
  return dateOnly[lang].format(new Date(at));
}
