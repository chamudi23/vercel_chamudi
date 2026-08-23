# Proposed CSRM Changes — for Review, Not Applied

> Recommendations to the **Centralized Specimen Record Management** system (CSRM)
> that would let the **Automated Skeletal Analysis System** (ASA, Module 3.1)
> match specimens more accurately — **without breaking anyone's working system**.

| | |
|---|---|
| **Status** | 📋 **Proposal only — nothing in this document has been applied** |
| **Decision owner** | The CSRM module owner |
| **Applies to** | The shared OAHRIS Supabase project (`specimens`, `measurements`, `skeletal_inputs`, `excavation_records`) |
| **Companion script** | [csrm_proposed_changes.sql](csrm_proposed_changes.sql) — each section independently runnable and reversible |
| **Reviewed against** | `main` @ PR #26 (the current CSRM code), live data 22 Aug 2026 |
| **Related** | [CSRM_SIMILAR_CASES_INTEGRATION.md](CSRM_SIMILAR_CASES_INTEGRATION.md) — how the link works today |

---

## 0. Headline: CSRM needs less than expected

The short answer to *"what should CSRM change?"* is **very little**. Reviewing
the current form and data-entry code found that CSRM has **already solved** most
of what the integration would otherwise have to ask for:

| Concern | Status in current CSRM |
|---|---|
| Is `specimens.bone_type` reliably populated? | ✅ **Already solved** — required field, validated, from a controlled picklist |
| Is there a controlled bone vocabulary? | ✅ **Already exists** — `CONTROLLED_BONE_CATEGORIES` (28 categories, each with `section`, `region`, `laterality`) |
| Is "Phalanx" hand-or-foot ambiguity handled? | ✅ **Already solved** — separate `Phalanx (Hand)` / `Phalanx (Foot)` categories; bare `Phalanx` is tagged `ambiguous-legacy` |
| Are aliases/legacy names resolved? | ✅ **Already exists** — `SAFE_CATEGORY_ALIASES` + `normalizeBoneCategory()` |
| Are `excavation_records` linked to specimens? | ✅ **Fixed going forward** — the current form writes `specimen_id`; only legacy rows are unlinked |

**Consequently ASA changed, not CSRM.** ASA's bone map has been realigned to
CSRM's `section` / `region` vocabulary, and it now reads `Phalanx (Hand)` and
`Phalanx (Foot)` as decisive rather than ambiguous. That was a one-file change
on the ASA side and required nothing from CSRM.

What genuinely remains is **one data-entry request (C1)** and a handful of
small, optional refinements.

> **Correction to an earlier draft of this document.** An initial pass claimed
> the CSRM form does not capture `specimens.bone_type`. That was read from an
> **outdated copy** of `SpecimenFormPage.jsx` on the `chamudi` branch. The
> current form on `main` does capture it, as a required, validated field. The
> claim was wrong and has been withdrawn.

---

## 1. Ground rules

Everything proposed here obeys four rules, so that **no existing screen, form,
query or record stops working**:

1. **Additive only.** New nullable columns, new tables, new indexes, new views.
   Nothing renamed, retyped, dropped or made `NOT NULL`.
2. **No enforcement on existing columns.** No `CHECK` constraint or validated
   foreign key on a column that already holds data.
3. **Every change is independently reversible**, with the rollback stated.
4. **ASA keeps working if none of this is done.** This is about *match quality*,
   not *functioning*. Nothing here is a prerequisite.

---

## 2. Evidence baseline

Measured against the live catalogue on **22 August 2026**:

| Table | Rows | Observation |
|---|---|---|
| `specimens` | 102 | `bone_type` populated **102/102** · `height_estimate` null **102/102** · `sex_estimate` unknown/null **75/102** · `age_estimate` unknown/null 22/102 |
| `measurements` | 102 | 101/102 specimens have ≥1 · 0 orphans · 7 distinct `measurement_type` values · `unit` includes a non-length value (`count`) |
| `skeletal_inputs` | **1** | **1/102 specimens** — 29 columns, richly modelled, essentially unpopulated |
| `excavation_records` | 32 | **31/32 have `specimen_id = NULL`** — legacy rows predating the current form |
| `laboratory_dating_results` | 1 | linked correctly |

**Finding A — `specimens.length_cm` duplicates `measurements.value`.**
For all 98 comparable rows, `specimens.length_cm × 10 === measurements.value`
(exactly, zero mismatches). The same fact is stored twice, in two units. The
copy **loses the measurement's semantic type** — the 98 values are actually:

```
 40  Maximum Preserved Length   (a fragment — a lower bound, not a length)
 28  Maximum Length             (a real length)
 26  Maximum Crown Diameter     (a width, not a length)
  4  Maximum Height             (a height, not a length)
  2  Recorded Elements          (a COUNT — not a dimension at all)
  1  Minimum Diameter
```

A column named `length_cm` therefore holds counts and widths. **This is why ASA
reads `measurements` and ignores `length_cm`** — only `measurements` records
what the number *means*. See C5; the recommendation is explicitly **not** to
drop it.

**Finding B — `skeletal_inputs` is the one real gap.** It maps almost
field-for-field onto what ASA Step 2 asks an analyst for, and it is the highest
-weighted evidence channel in the matcher. At 1/102 populated, that channel
almost never fires. See C1.

---

## 3. Change register

Priority: 🔴 high value · 🟠 useful · 🟡 optional.
Risk is the risk *to CSRM and other modules*, not to ASA.

| # | Change | Type | Priority | Risk |
|---|---|---|---|---|
| **C1** | Populate `skeletal_inputs` for catalogued specimens | *data* | 🔴 | none |
| **C2** | Publish the existing bone vocabulary to the database | *schema, additive* | 🟠 | none |
| **C3** | Add `measurements.is_complete` (nullable) | *schema, additive* | 🟠 | very low |
| **C4** | Add three indexes | *schema, additive* | 🟡 | none |
| **C5** | Document `length_cm/width_cm/thickness_cm` as derived | *documentation* | 🟡 | none |
| **C6** | Add read-only view `v_specimen_analysis_profile` | *schema, additive* | 🟠 | none |
| **C7** | Backfill legacy `excavation_records.specimen_id` | *data* | 🟡 | low |
| **C8** | Decide the fate of `specimens.height_estimate` | *decision* | 🟡 | none |

---

### C1 · Populate `skeletal_inputs` 🔴 — *data only, zero schema risk*

**The single most valuable thing CSRM can do for the integration**, and it needs
no schema change at all: the table and all 29 columns already exist, and the
CSRM form already writes to them.

**Why.** `skeletal_inputs` drives the `features` channel — weighted **0.25**,
and the only channel that compares *what the bone actually looks like* rather
than where it was found. At 1/102 populated it almost never fires, so most
matches currently rest on bone group, locality and recorded profile alone.

Columns ASA reads (the other 12 are ignored, harmlessly):

| ASA analysis type | `skeletal_inputs` columns consumed |
|---|---|
| Skull | `skull_brow_ridge`, `mastoid_process_size`, `jaw_shape`, `cranial_suture_status` |
| Pelvis | `subpubic_angle`, `sciatic_notch_width`, `pubic_symphysis_stage` |
| Upper Limb | `humerus_length`, `upper_limb_robusticity` |
| Lower Limb | `femur_length`, `femur_head_diameter`, `growth_plate` |
| Thorax | `rib_shape`, `sternum_length` |
| Teeth | `teeth_type`, `dental_wear`, `tooth_eruption_stage` |

**Partial data is genuinely useful.** ASA drops empty channels and
redistributes their weight, so **one** recorded feature already helps. Nothing
needs to be complete.

**Existing wording is fine.** ASA bridges vocabularies by keyword — "Moderately
Closed", "Moderate Closure" and "moderate" all land on the same scale.
Unrecognised wording is skipped, never guessed at; if a new term should be
understood, that is a one-line alias on ASA's side and needs nothing from CSRM.

**Impact.** CSRM: none — data entry through the existing form.
ASA: match quality rises immediately and automatically.
**Rollback:** delete the rows.

---

### C2 · Publish the existing bone vocabulary to the database 🟠

**Not a new vocabulary — the one CSRM already has.**
`CONTROLLED_BONE_CATEGORIES` in `src/utils/pp1ImageModule.js` already defines 28
categories, each tagged with `section` (Skull, Teeth, Upper Limb, Vertebral
Column, Thorax, Pelvis, Lower Limb, Hands and Feet), `region`, and `laterality`,
plus a `LEGACY_BONE_CATEGORIES` list and an alias resolver.

**The only problem is that it lives in JavaScript, not in the database**, so
nothing outside the CSRM front-end can read it. ASA currently mirrors it by
hand, which means the two copies can drift.

**What.** Materialise it as a small table (`bone_type_reference`) — one row per
controlled category with its `section`. CSRM can generate it from the constant
it already maintains.

**Critically: no foreign key, no `CHECK` against `specimens.bone_type`.** The
table is advisory. Enforcing it would reject any value not in the list and break
cataloguing the moment an unusual element appears.

**Impact.** CSRM: optional — ignore it and nothing changes; the JS constant stays
the source of truth. ASA: could read the sections directly instead of
maintaining a mirror, removing drift.
**Rollback:** `drop table public.bone_type_reference;`

> **Not proposed:** adding an `element_group` column to `specimens`. An earlier
> draft suggested this. It is unnecessary — `bone_type` already comes from a
> controlled list whose section is derivable, so the group can be looked up
> rather than stored twice.

---

### C3 · Add `measurements.is_complete` 🟠 — *additive, nullable*

```sql
alter table public.measurements
  add column if not exists is_complete boolean;   -- nullable tri-state
```

`true` = whole element measured · `false` = fragmentary · `NULL` = not stated.

**Why.** This is Finding A's practical consequence. 40 of 102 measurements are
*"Maximum Preserved Length"* — a **lower bound** on a broken bone, not its
length. Comparing an ASA complete-bone figure against it would penalise a
specimen for being fragmentary, so ASA currently detects this **by matching the
string `"preserved length"`** and drops the metric channel.

String matching is fragile. A boolean states the fact directly, and would let
ASA *use* a complete measurement it currently skips because the wording was
unfamiliar.

How load-bearing this is: **all 8 humerus records** in the catalogue are
fragmentary (50.6 mm – 148.2 mm, against a real humerus of roughly 300 mm).

**Impact.** CSRM: none — nullable, existing inserts unaffected. Optionally the
measurement row gains a checkbox.
ASA: replaces a string heuristic with a fact.
**Rollback:** drop the column; ASA's heuristic remains as the fallback either way.

---

### C4 · Add three indexes 🟡 — *invisible, zero behavioural risk*

```sql
create index if not exists measurements_specimen_id_idx    on public.measurements    (specimen_id);
create index if not exists skeletal_inputs_specimen_id_idx on public.skeletal_inputs (specimen_id);
create index if not exists specimens_bone_type_idx         on public.specimens       (bone_type);
```

**Why.** ASA issues one filtered `specimens` read plus two
`WHERE specimen_id IN (…)` reads per panel render. At ~100 rows this changes
nothing measurable — it matters as the catalogue grows. CSRM's own specimen
detail and duplicate-check queries (which already select on `specimen_id` and
`skeleton_code`) benefit identically.

**Impact.** No behavioural change to anything; marginal extra insert cost.
**Rollback:** `drop index …`.

---

### C5 · Document `length_cm` / `width_cm` / `thickness_cm` as derived 🟡

**Documentation, not a schema change.** Add column comments recording that these
are unit-converted copies of the specimen's first `measurements` row, that they
do not carry the measurement's semantic type, and that `measurements` is the
source of truth.

**Why.** Finding A: the copy is exact (98/98) but lossy. Anyone reading
`length_cm` as a length will be wrong 70 of 98 times.

**Explicitly NOT recommended: do not drop these columns.** They are populated
and something outside this repository may read them. Documenting the hazard
costs nothing and removes the trap.

**Impact.** None — comments are metadata.
**Rollback:** set the comments to null.

---

### C6 · Add read-only view `v_specimen_analysis_profile` 🟠 — *additive*

A view that pre-joins the three tables into one row per specimen — see
[csrm_proposed_changes.sql](csrm_proposed_changes.sql) §6.

**Why.** The cleanest long-term contract between the two systems. Today ASA
names CSRM columns directly (confined to one file, but still direct coupling). A
view is an explicit, owned interface: CSRM can restructure the underlying tables
freely and keep the view's output stable, and ASA never notices.

**Why it is safe.** A view reads; it stores nothing and constrains nothing.
Creating it cannot affect any existing query, and no CSRM screen need use it.

⚠️ **One caveat:** a view does not inherit the base tables' row-level security by
default. Set `security_invoker = on` (shown in the script) so it is evaluated
with the querying user's permissions and existing RLS still applies.

**Impact.** CSRM: gains a stable published interface; no existing behaviour
changes. ASA: could drop from three queries to one — an optimisation, not a
requirement.
**Rollback:** `drop view public.v_specimen_analysis_profile;`

---

### C7 · Backfill legacy `excavation_records.specimen_id` 🟡 — *data*

**Not a defect in the current system.** The form on `main` writes
`specimen_id` when creating an excavation record. The 31 unlinked rows are
**legacy data predating that fix**.

**Why bother.** Those rows hold `excavation_date`, `depth_found` and
`excavator_name` that cannot presently be attributed to any specimen — a
CSRM-internal loss before it is an ASA one. ASA would use a real excavation date
instead of falling back to `excavation_year` / `created_at`.

**Caution.** Only the CSRM owner knows the correct mapping. **Do not guess.** If
it is unrecoverable, leave the rows: ASA does not read this table today and
nothing regresses.

**Do not add a validated foreign key** while nulls remain — use `NOT VALID` so
only new rows are checked.

**Rollback:** set the values back to `NULL`.

---

### C8 · Decide the fate of `specimens.height_estimate` 🟡

Null in **all 102 rows**. Either it should be populated (ASA computes stature
from long bones and could cross-check against it), or acknowledged as unused.
**No action proposed** — a flag for the CSRM owner. ASA does not read it.

---

## 4. Explicitly NOT recommended

Each of these would improve the model in the abstract and is exactly what to
avoid, because it can break the CSRM form or another module without warning:

| ❌ Change | Why it breaks something |
|---|---|
| Renaming any existing column | Breaks the form's insert payload, `select *` consumers, and ASA's column map. A rename is a coordinated breaking migration, never a quiet improvement. |
| Adding `CHECK` constraints to existing columns | Rejects existing rows if any violate, and rejects future legitimate values. If ever needed, use `NOT VALID`. |
| Making any column `NOT NULL` | `sex_estimate` is unknown/null in 75/102 and `height_estimate` in 102/102 — the statement fails outright. Even if it succeeded, the form would start rejecting valid partial records; partial data is normal in archaeology. |
| A **validated** FK on `excavation_records.specimen_id` | Fails immediately — 31/32 rows are unlinked. |
| A FK from `specimens.bone_type` to a vocabulary table | Would reject any element not in the controlled list mid-cataloguing. The list is advisory for good reason. |
| Changing a column's type (e.g. `value` → `numeric(10,2)`) | Rewrites the table, may truncate, and can break clients expecting the current representation. |
| Dropping `length_cm` / `width_cm` / `thickness_cm` | Populated, and possibly read outside this repository. Document instead (C5). |
| Converting `bone_type` to an enum | Every new element type then needs a migration. |
| Triggers to sync `length_cm` with `measurements` | Adds hidden write-path behaviour and a new failure mode to a working form. Prefer C5. |
| Tightening RLS on the three tables | ASA reads with the `anon` key; tightening would silently empty the Similar Cases panel. Coordinate first. |

---

## 5. Impact matrix

| Change | CSRM form | CSRM specimen list/detail | ASA Similar Cases | Other modules |
|---|---|---|---|---|
| C1 populate `skeletal_inputs` | none (existing form) | none | **accuracy ↑↑** | none |
| C2 publish vocabulary | none (optional source) | none | removes mirror drift | shared vocabulary |
| C3 `is_complete` | none (nullable) | one unread extra column | more usable metrics | none |
| C4 indexes | none | slightly faster | slightly faster | slightly faster |
| C5 comments | none | none | none | removes a misreading hazard |
| C6 view | none | none | optional simplification | a stable interface |
| C7 legacy backfill | none | excavation context usable | none today | none |
| C8 decision | none | none | none | none |

**If nothing is done:** ASA continues working exactly as it does today. The
`features` channel stays mostly dormant and the fragmentary-measurement rule
keeps relying on string matching. Nothing breaks.

---

## 6. Suggested order

| Step | Change | Effort | Who |
|---|---|---|---|
| 1 | **C1** — start recording `skeletal_inputs` | ongoing data entry | CSRM analysts |
| 2 | **C4** — indexes | 1 min | CSRM owner |
| 3 | **C5** — column comments | 5 min | CSRM owner |
| 4 | **C3** — `is_complete` | 5 min + optional form work | CSRM owner |
| 5 | **C2** — publish the vocabulary | 15 min | CSRM owner |
| 6 | **C6** — the view | 10 min | CSRM owner |
| 7 | **C7 / C8** | optional | CSRM owner |

Steps 2–3 are free and risk-free. Step 1 is the one that actually moves the
needle.

---

## 7. Keeping the two systems in sync afterwards

1. **Tell ASA before renaming or removing a column it reads** — the full list is
   in [CSRM_SIMILAR_CASES_INTEGRATION.md](CSRM_SIMILAR_CASES_INTEGRATION.md) §3.
   New columns and new tables are always safe; ASA ignores what it does not know.
2. **New vocabulary is safe.** New `bone_type` values, feature wordings and
   measurement types are all handled — unknown values are skipped, never
   misread.
3. **New controlled categories are worth a heads-up.** When CSRM adds a category
   to `CONTROLLED_BONE_CATEGORIES`, ASA should mirror its `section` so the
   element is matched at full confidence rather than being skipped. Until C2 is
   adopted, that mirror is manual — which is the argument for C2.

---

*OAHRIS · R26-ISE-006 · Prepared by the Automated Skeletal Analysis System module
(Chamudi Gayeshika, IT22299802) for the CSRM module owner · 22 August 2026*
