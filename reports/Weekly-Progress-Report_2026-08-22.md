# 🦴 OAHRIS — Weekly Research Progress Report

> **Osteoarchaeological Research Information System** · Module 3.1 — Automated Skeletal Analysis System

| | |
|---|---|
| **Project ID** | R26-ISE-006 |
| **Module** | Automated Skeletal Analysis System (Module 3.1) |
| **Student** | Chamudi Gayeshika — **IT22299802** |
| **Supervisor** | Mrs. Buddhima Attanayake |
| **Degree** | B.Sc. (Hons) IT — Information System Engineering, SLIIT |
| **Reporting Period** | Week of 16 – 22 August 2026 |
| **Report Date** | 22 August 2026 |
| **Repository** | `github.com/chamudi23/vercel_chamudi` (branch `chamudi`) |

---

## 1. Executive Summary

This week delivered the **cross-module integration** between the Automated
Skeletal Analysis System (ASA) and the **Centralized Specimen Record Management**
system (CSRM) — the item carried forward from last week's plan
("*finalize the report Similar Cases from live data*").

The **Similar Cases** panel, previously hard-coded demo data (`C089` / `C102`,
"Texas" / "Nevada"), now draws live from the CSRM catalogue. Cases are matched to
the analysis actually in progress — by bone group, by the morphological features
the analyst selected in Step 2, by metric measurements, by excavation locality,
and by recorded biological profile — and are ranked with an explainable match
percentage.

The defining constraint was that **neither system's existing code or schema could
change**. The integration is therefore a one-way, read-only, additive layer
living entirely on the ASA side: three new ASA files, two ASA view files edited
to drop their mock arrays, and **zero** modifications to CSRM source or SQL, and
**zero** changes to ASA's own attributes, prediction rules or persistence.

**Overall status:** 🟢 On track — the week's objective met, verified and documented.

---

## 2. Objectives for the Week

| # | Objective | Status |
|---|---|---|
| 1 | Replace the mock Similar Cases with live CSRM data | ✅ Completed |
| 2 | Map CSRM `skeletal_inputs` + `measurements` to ASA analysis types | ✅ Completed |
| 3 | Make matching bone-type aware (different results per analysis type) | ✅ Completed |
| 4 | Integrate **without any change** to the CSRM codebase or SQL tables | ✅ Completed |
| 5 | Integrate **without any change** to ASA attributes or backend | ✅ Completed |
| 6 | Verify the matching engine against live catalogue data | ✅ Completed |
| 7 | Document how the two systems are linked | ✅ Completed |

---

## 3. Work Completed

### 3.1 Read-Only Bridge to the Specimen Catalogue
- Built [src/lib/specimenRegistry.js](../src/lib/specimenRegistry.js) — the single
  place CSRM table and column names appear in the ASA module.
- Reads three CSRM tables: **`specimens`** (catalogue master), **`measurements`**
  (metric observations) and **`skeletal_inputs`** (morphological observations).
- Every statement is a `SELECT`. There is no insert / update / upsert / delete /
  rpc anywhere in the integration — confirmed by grep and recorded as a
  regression check.
- Uses a **dedicated read-only client** for the CSRM project instead of importing
  the shared client, so CSRM code stays untouched and a mis-configured shared
  client can never break the ASA module.
- Connects with the `anon` key, so CSRM's **Row-Level Security continues to
  govern visibility** — the integration sees no more than any other anonymous
  reader and holds no privilege of its own.

### 3.2 Cross-System Mapping — the core problem solved
The two systems describe bone at **different granularities** and with
**different vocabularies**, and neither could be altered:

| | ASA | CSRM |
|---|---|---|
| Granularity | 6 analysis groups (Skull, Pelvis, Upper/Lower Limb, Thorax, Teeth) | element-level anatomy (Mandible, Maxilla, Molar, Talus, Calcaneus, Phalanx, …) |
| Feature values | closed slugs — `moderate-closure` | free text — "Moderately Closed" |
| Units | always millimetres | free `unit` column — `mm`, `cm`, `count` |

Three declarative lookup tables in
[src/lib/similarCases.js](../src/lib/similarCases.js) bridge that gap:

- **`ANALYSIS_BONE_MAP`** — each ASA analysis type declares which CSRM
  `bone_type` values **belong** to it (*primary*) and which only **may** belong
  (*secondary* — an unqualified "Phalanx" could be hand or foot; a "Skeleton
  Assemblage" contains everything). This is what makes results differ correctly
  per analysis type: a Teeth analysis surfaces Molars and Premolars, a Lower Limb
  analysis surfaces Tali, Calcanei and Metatarsals.
- **`FEATURE_MAP`** — 17 ASA Step-2 fields mapped to their `skeletal_inputs`
  columns, with **keyword aliases** that place free-text CSRM values on the same
  ordinal scale as ASA's closed option list. Near misses earn **partial credit**
  (*Moderate* vs *Prominent* → 0.75, not 0); unrecognised wording is skipped
  rather than guessed at.
- **`METRIC_MAP`** — ASA numeric fields mapped to `measurements` rows, with unit
  normalisation to millimetres.

### 3.3 Explainable Match Scoring
- Five independent evidence channels — **bone group (0.40)**, **morphological
  features (0.25)**, **metric measurements (0.15)**, **provenance (0.10)** and
  **biological profile (0.10)**.
- A channel with **no data is dropped and its weight redistributed**, so a
  sparsely-recorded specimen is never punished for what CSRM simply did not
  record.
- Every row carries a plain-language explanation of *why* it matched
  ("*Skull is a Skull element · 3/3 morphological features agree · same area —
  Vavuniya*"), shown on hover.
- Results below 35 % are hidden; the top 5 are shown, ranked by match, then
  evidence count, then primary tier, then recency.

### 3.4 Two Osteological Corrections Found During Verification
Testing against real catalogue data surfaced two modelling errors that a
naive join would have shipped:

- **Fragmentary material.** Most CSRM limb records are *"Maximum Preserved
  Length"* — a **lower bound** on true bone length, not the length. Scoring an
  ASA complete-bone figure against it would penalise a specimen merely for being
  fragmentary. Such rows are now excluded from metric scoring and the channel is
  dropped instead. This is load-bearing, not hypothetical: **all 8** humerus
  records in the catalogue are fragmentary (50.6 mm – 148.2 mm).
- **Non-length units.** CSRM records `unit = 'count'` for "Recorded Elements".
  These are now rejected as not comparable rather than silently read as a length.

### 3.5 UI Integration
- New [src/components/KgcSimilarCases.jsx](../src/components/KgcSimilarCases.jsx)
  with proper **loading / empty / error / results** states, a match badge, and
  secondary detail lines (skeleton code, side, district, time period).
- Wired into **Step 3 — Prediction Results** and the **Report** page, replacing
  both mock arrays.
- The panel is strictly **additive**: if CSRM is unreachable it shows a message
  and the analysis workflow is entirely unaffected.

### 3.6 Integrity of Both Systems Preserved
- CSRM source files — `SpecimenFormPage.jsx`, `SpecimenListPage.jsx`,
  `MinuriModulePage.jsx`, `supabase.js` — **unchanged** (verified via
  `git status`).
- **No** CSRM table, column, view, index, trigger, constraint or RLS policy
  created or altered; **no** migration script introduced.
- ASA's Step-1/Step-2 forms, `computePredictions()` rules, `AnalysisContext`,
  `analysisStore.js` and the `analyses` table — **unchanged**. Matched cases are
  derived at view time and discarded; a saved analysis holds exactly the same
  fields it did before.

### 3.7 Documentation
- Authored [CSRM_SIMILAR_CASES_INTEGRATION.md](../CSRM_SIMILAR_CASES_INTEGRATION.md)
  — architecture diagram, full mapping tables, the scoring formula, query flow,
  failure behaviour, a worked example, verification results, and an extension
  guide covering what to edit if CSRM ever changes.

---

## 4. Technical Implementation

| Area | Technology / Approach |
|---|---|
| Integration style | Data-contract coupling (table + column names), **not** code coupling |
| Direction | CSRM → ASA, one-way, read-only |
| Transport | Supabase PostgREST `SELECT` via `anon` key (RLS enforced) |
| Query shape | 3 queries per render — 1 filtered specimen fetch + 2 concurrent `IN (…)` fetches (**no N+1**) |
| Vocabulary bridging | Ordinal scales with keyword aliases; partial credit for adjacent levels |
| Score model | Weighted mean over *available* evidence channels, weights redistributed |
| Frontend | React 18, Vite 5, Tailwind CSS 3 (matching existing module styling) |

**Architecture highlights**
- All CSRM naming is confined to one file, so a CSRM rename is a one-line change.
- The scoring engine is pure and I/O-free, which is what made it unit-testable
  against fixtures pulled from the live catalogue.
- Adding a sixth evidence channel requires one function and one array entry — the
  weight-redistribution maths needs no change.

---

## 5. Testing & Verification

| Check | Result |
|---|---|
| Unit tests over the scoring engine (29 assertions) | ✅ 29 passed, 0 failed |
| `bone_type` coverage — every catalogue value maps to ≥ 1 analysis type | ✅ 12 / 12 |
| Live end-to-end run, all 6 analysis types vs 102 specimens + 102 measurements | ✅ Sensible ranked results |
| Vocabulary bridging (`moderate-closure` ⇄ "Moderately Closed"; `less-25mm` ⇄ "Small") | ✅ |
| Ordinal partial credit (adjacent levels → 75 %, opposite ends → 0 %) | ✅ |
| Unit conversion `cm` → `mm`; rejection of `count` | ✅ |
| Fragmentary "Maximum Preserved Length" excluded from metric scoring | ✅ |
| Weight redistribution (bone-group-only ⇒ 100 %, not 40 %) | ✅ |
| CSRM `Unknown` sex ignored rather than scored as a mismatch | ✅ |
| Bone-group gate (a Femur never appears in a Skull analysis) | ✅ |
| ESLint on new/changed non-component files | ✅ Clean |
| Production build (`vite build`) | ✅ Passes (2996 modules) |
| CSRM files unmodified | ✅ `git status` clean for all CSRM paths |
| No write operation anywhere in the integration | ✅ Confirmed by grep |

**Sample live result** — Skull analysis at Vavuniya (brow ridge *Moderate*, jaw
*V-shaped*, suture *Moderate Closure*):

```
100%  SPEC-521  Skull     Pallemalala Prehistoric Site  2026-08-22
      why: Skull is a Skull element | 3/3 morphological features agree | same area - Vavuniya
 83%  SPEC-062  Mandible  Mihintale                     2019
      why: Mandible is a Skull element | recorded biological profile agrees
```

---

## 6. Challenges & Resolutions

| Challenge | Resolution |
|---|---|
| The two systems classify bone at different granularities (6 groups vs element-level anatomy) | Introduced `ANALYSIS_BONE_MAP` with *primary* / *secondary* tiers, so ambiguous elements (Phalanx, Skeleton Assemblage) match at reduced confidence rather than being dropped or over-credited. |
| ASA uses closed slugs, CSRM uses free text, and neither vocabulary could change | Ordinal scales with keyword aliases place both onto a shared scale at read time; unrecognised wording is skipped rather than guessed. |
| Sparsely-populated CSRM records would score low purely for missing data | Weighted mean over *available* channels only, with weights redistributed. |
| Fragmentary "Maximum Preserved Length" is not comparable to a complete-bone measurement | Excluded from metric scoring so fragmentary specimens lose the channel instead of scoring 0. |
| `measurements.unit` includes non-length units (`count`) | Unit normalisation whitelist; unknown units marked not comparable. |
| CSRM must not be modified, but ASA needed its data | One-way read-only client on the ASA side; CSRM code and schema never referenced except by table/column name. |
| A CSRM outage must not break an in-progress analysis | Panel isolated with its own error state; sub-queries fail non-fatally so matching degrades rather than dying. |
| `skeletal_inputs` currently holds only one row | Matching designed to work from whatever exists; the feature channel is exercised by unit tests and sharpens automatically as CSRM analysts record more. |

---

## 7. Version Control Activity

Files added:

```
src/lib/specimenRegistry.js            Read-only CSRM data-access layer
src/lib/similarCases.js                Mapping + scoring engine
src/components/KgcSimilarCases.jsx     Similar Cases panel
CSRM_SIMILAR_CASES_INTEGRATION.md      Integration documentation
reports/Weekly-Progress-Report_2026-08-22.md
```

Files modified (presentation only):

```
src/pages/NewAnalysis/KgcStep3Review.jsx   mockCases            -> <KgcSimilarCases />
src/pages/KgcReport.jsx                    mockSimilarCasesData -> <KgcSimilarCases compact />
```

Files deliberately **not** modified:

```
src/pages/SpecimenFormPage.jsx   src/pages/SpecimenListPage.jsx
src/pages/MinuriModulePage.jsx   src/supabase.js
(all CSRM SQL objects — no migration introduced)
```

---

## 8. Deliverables

| Deliverable | Where |
|---|---|
| Live Similar Cases on Prediction Results | `/skeletal/analysis/step3` |
| Live Similar Cases on the report | `/skeletal/report/:caseId` |
| Read-only CSRM data-access layer | `src/lib/specimenRegistry.js` |
| Cross-system mapping + scoring engine | `src/lib/similarCases.js` |
| Similar Cases UI component | `src/components/KgcSimilarCases.jsx` |
| Integration documentation | `CSRM_SIMILAR_CASES_INTEGRATION.md` |

---

## 9. Plan for Next Week

- [ ] Ask the CSRM team to populate `skeletal_inputs` for more specimens — the
      feature channel is built and tested, and match quality rises directly with
      that coverage. **No ASA change required.**
- [ ] Make a matched specimen row click through to its CSRM record for full
      provenance (still read-only).
- [ ] Replace the report's remaining mock **Age Distribution** chart with real
      aggregates from the `analyses` table.
- [ ] Add an **admin "learner progress" dashboard** (carried forward).
- [ ] Move committed secrets (`.env.local`) out of version control and rotate keys
      (carried forward).
- [ ] Prepare a **Pull Request** from `chamudi` → `main` for review/deployment.

---

## 10. References

- Bass, W. M. (2005). *Human Osteology: A Laboratory and Field Manual* (5th ed.). Missouri Archaeological Society.
- White, T. D., Black, M. T., & Folkens, P. A. (2012). *Human Osteology* (3rd ed.). Academic Press.
- Buikstra, J. E., & Ubelaker, D. H. (1994). *Standards for Data Collection from Human Skeletal Remains.*

---

*Prepared by Chamudi Gayeshika (IT22299802) · OAHRIS — Automated Skeletal Analysis System · 22 August 2026*
