# Acceptance record

One section per phase. Each records what the verification protocol actually showed, not what was intended.

## Phase 1 — Foundation

Date: 7 Oct 2026 (simulated clock start 07 Oct 2026, 09:00 Europe/London).

### What was built

- `src/mro/domain/` — `types`, `money`, `clock`, `evaluateGate`, `commands`, `reducer`, `selectors`, `value`.
- `src/mro/data/` — `clientProfile`, `masterData` (four UK sites, `siteById`), `policies` (`POL-DEMO-1`), `storyFixtures` (catalogue fixture only), `seedDomain`.
- `src/mro/services/` — `mockConnectors` (deterministic ERP PO, failure injection, no UI), `snapshot` (persist and reset).
- The store owns the domain; every change goes through `dispatch(command)`.
- Requisitions has a **Cases** block. At boot, `CASE-CAT-001` is run through real commands: submit → gate → policy approval → PO dispatch. Phase 2 removes the boot seed and submits from New Request.
- Languages narrowed to EN/DE. New copy is in `src/mro/lib/i18n-ap.ts`.
- The entry gate, MRO login and sidebar now read "Automotive Procurement · Demo environment". The three entry images were replaced: one showed a refinery, one carried a robot maker's logo, one showed a bicycle.
- `docs/PRD.md` replaced with the new PRD, with §25 build decisions added.

### Verification protocol

| Step | Result |
| --- | --- |
| 1. `npx tsc -b` | 0 errors. |
| 2. `npx vitest run` | 41 / 41 pass in 4 files (list below). |
| 3. `npm run lint` | 143 errors and 1 warning, identical file by file to `HEAD` before this phase. All of them are inherited. New and changed domain files have 0 errors. The plan's baseline of "48 errors" was wrong; the real repo-wide baseline is 143 errors and 1 warning. |
| 4. Browser | Partly done, see below. |
| 5. Refresh hold | Applies from Phase 2. |
| 6. Text scan `orvantec\|apex industrial\|siemens\|usd\(` | 0 hits in the entry gate, login, sidebar, `index.html`, and the new domain, data, services and cases files. |

#### New tests

- **Gate order:** scope comes before the controls, the controls before authority, and authority before lane. HC02 names the DoA role. The catalogue case passes touchless.
- **DoA boundaries:** £2,999.99, £3,000, £30,000, £30,000.01, £100,000, £100,000.01, £249,999.99 and £250,000 each route to the right owner. £2,999.99 is eligible for standing approval and exactly £3,000 is not. A Budget Holder approval does not cover £30,000.01. An approval given on an older revision does not count.
- **Confidence cannot repair a hard constraint:** a sanctions hit blocks, unsigned savings are not validated, and a Red clause without Legal sign-off blocks — each at perfect confidence.
- **Missing dimensions:** a missing dimension blocks unless a pattern rule declares it inapplicable, in which case its weight is redistributed. Missing mandatory data blocks. Lane thresholds are 0.90 and 0.70.
- **Reducer:** the catalogue fixture ends with a £480 PO, the approval actor is the policy, and the case counts as fully touchless. 80 packs creates a Budget Holder task; a requester cannot decide it; the approval releases exactly one PO.
- **Revisions and idempotency:** a command on a stale revision is rejected. A double submit creates one case. Reopening the same capture returns the existing case.
- **ERP failure:** three retries on the same key, then the case is parked and a 4-hour task is opened.
- **Money and value:** amounts are integer pence. An unsigned "validated" record is excluded. A value-analyst signature does not count; a Finance BP signature does.
- **EN/DE:** every new phrase exists in both languages. Every seeded event, role and unit has a phrase. Dates are London time in both locales.

#### Browser verification click script

| Check | Result |
| --- | --- |
| No old names on the entry gate or sidebar | Pass at 1440×900 (entry) and 982×765 (sidebar, EN and DE). |
| The language switch offers only EN and DE | Pass. |
| Requisitions shows `CASE-CAT-001`, £480.00, Halewood, Touchless, PO dispatched, `PO-AP-7001`; the policy is the actor; 07 Oct 2026 | Pass in EN and DE at 982×765. |
| The case is unchanged after a refresh | **Not confirmed.** The snapshot is written to `localStorage` (8 KB), but the preview stopped routing ("sandbox not found") before the reload. |
| Legacy workspaces still open | **Not confirmed** in the browser, for the same reason. |
| Screenshots at 1440×900, 1280×800 and 1024×768 in EN and DE | **Incomplete.** Only 1440 (entry) and 982 (cases) were captured. |
| German audit trail: localised date ("Okt") and role ("Anforderer") | Fixed after the screenshot. Covered by a unit test only, not yet seen in the browser. |

### Deviations from the plan

- New phrases are in `lib/i18n-ap.ts`, because `lib/i18n.tsx` already uses the `lib/i18n` path (PRD §25).
- Gate order: confidence blocks such as missing data or expired evidence are reported **after** the lane review requirement. A reviewer's signature cannot stand in for a missing fact, so the case stays blocked even after review.
- The legacy Chinese, Spanish and French originals in the off-contract, onboarding and grinding-media stories were rewritten in English. Their "translated on read" framing was removed.

### Inherited issues (not fixed in Phase 1)

- The legacy dashboard, cards and requisition list still show USD amounts, "4 countries · 4 languages" and country cards that include Spain.
- At narrow widths (around 982px) the Requisitions header summary is clipped.
- The repo-wide lint baseline is 143 errors and 1 warning, spread across legacy freight, o2c, docs and workspace components.
- `store.tsx` exports a hook next to its provider (`react-refresh/only-export-components`). This was already the case before the phase.

### Known limitations

- `CASE-CAT-001` is created by a boot seed, not from New Request (Phase 2).
- The Cases block is read-only. There are no approval cards, presenter controls or Review as yet (Phase 2).
- The ERP failure injection has no UI yet.

Waiting for confirmation before Phase 2.
