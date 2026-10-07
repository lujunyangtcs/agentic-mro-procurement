/**
 * The five primary stories. Story order and IDs ST01–ST05 follow the source
 * sheet order (rows 6, 9, 4, 10, 2); presenters see the source use-case
 * number next to each so "UC2" and "ST05" never get confused. Case IDs, sites
 * and outcomes come from the I/O manifests.
 */

import type { SiteId, StoryId } from "@/mro/domain/types";
import { IO, type UseCaseKey } from "@/mro/data/stories/io";
import { siteByName } from "@/mro/data/masterData";

export type StoryDef = {
  id: StoryId;
  uc: UseCaseKey;
  ucLabel: string;
  caseId: string;
  title: { en: string; de: string };
  /** Site named by the requester in the I/O; UC10 is award-triggered and names none. */
  site?: SiteId;
  flowPath: string;
  outcome: string;
  humanTouchpoints: string[];
  interventions: string[];
  /** Build phase that makes the story launchable. */
  phase: number;
};

const site = (name: string | undefined) => (name ? siteByName(name)?.id : undefined);

export const STORIES: StoryDef[] = [
  {
    id: "ST01",
    uc: "uc06",
    ucLabel: "UC6",
    caseId: IO.uc06.manifest.case_id,
    title: { en: "Reuse licences before buying", de: "Lizenzen vor dem Kauf wiederverwenden" },
    site: site(IO.uc06.intake.input.request.requester.site),
    flowPath: IO.uc06.manifest.flow_path,
    outcome: IO.uc06.manifest.outcome,
    humanTouchpoints: IO.uc06.manifest.human_touchpoints,
    interventions: IO.uc06.manifest.tail_spend_interventions,
    phase: 3,
  },
  {
    id: "ST02",
    uc: "uc09",
    ucLabel: "UC9",
    caseId: IO.uc09.manifest.case_id,
    title: { en: "Negotiate from quote evidence", de: "Auf Basis von Angebotsdaten verhandeln" },
    site: site(IO.uc09.sourcing.input.request.requester.site),
    flowPath: IO.uc09.manifest.flow_path,
    outcome: IO.uc09.manifest.outcome,
    humanTouchpoints: IO.uc09.manifest.human_touchpoints,
    interventions: IO.uc09.manifest.tail_spend_interventions,
    phase: 4,
  },
  {
    id: "ST03",
    uc: "uc04",
    ucLabel: "UC4",
    caseId: IO.uc04.manifest.case_id,
    title: { en: "Check the panel before onboarding", de: "Vor dem Onboarding das Panel prüfen" },
    site: site(IO.uc04.supplierMatch.input.request.requester.site),
    flowPath: IO.uc04.manifest.flow_path,
    outcome: IO.uc04.manifest.outcome,
    humanTouchpoints: IO.uc04.manifest.human_touchpoints,
    interventions: IO.uc04.manifest.tail_spend_interventions,
    phase: 5,
  },
  {
    id: "ST04",
    uc: "uc10",
    ucLabel: "UC10",
    caseId: IO.uc10.manifest.case_id,
    title: { en: "Resolve contract deviations", de: "Vertragsabweichungen klären" },
    flowPath: IO.uc10.manifest.flow_path,
    outcome: IO.uc10.manifest.outcome,
    humanTouchpoints: IO.uc10.manifest.human_touchpoints,
    interventions: IO.uc10.manifest.tail_spend_interventions,
    phase: 6,
  },
  {
    id: "ST05",
    uc: "uc02",
    ucLabel: "UC2",
    caseId: IO.uc02.manifest.case_id,
    title: { en: "Challenge a named specification", de: "Markenvorgabe hinterfragen" },
    site: site(IO.uc02.intake.input.request.requester.site),
    flowPath: IO.uc02.manifest.flow_path,
    outcome: IO.uc02.manifest.outcome,
    humanTouchpoints: IO.uc02.manifest.human_touchpoints,
    interventions: IO.uc02.manifest.tail_spend_interventions,
    phase: 7,
  },
];

export const storyById: Record<StoryId, StoryDef> = Object.fromEntries(STORIES.map((s) => [s.id, s])) as Record<StoryId, StoryDef>;
