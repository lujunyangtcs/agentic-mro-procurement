import type { ClientProfile } from "@/mro/domain/types";
import { CLOCK_START } from "@/mro/domain/clock";

export const clientProfile: ClientProfile = {
  displayName: "Automotive Procurement",
  environmentLabel: "Agentic Automotive Procurement",
  currency: "GBP",
  locale: "en-GB",
  timeZone: "Europe/London",
  clockStart: CLOCK_START,
  allowedSites: ["UK-SOL-01", "UK-HAL-01", "UK-WOL-01", "UK-GAY-01"],
  buyingOrg: "AP-UK",
};
