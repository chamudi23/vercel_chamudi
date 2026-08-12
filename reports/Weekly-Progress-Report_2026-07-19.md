# 🦴 OAHRIS — Weekly Research Progress Report

> **Osteoarchaeological Research Information System** · Module 3.1 — Automated Skeletal Analysis System

| | |
|---|---|
| **Project ID** | R26-ISE-006 |
| **Module** | Automated Skeletal Analysis System (Module 3.1) |
| **Student** | Chamudi Gayeshika — **IT22299802** |
| **Supervisor** | Mrs. Buddhima Attanayake |
| **Degree** | B.Sc. (Hons) IT — Information System Engineering, SLIIT |
| **Reporting Period** | Week of 13 – 19 July 2026 |
| **Report Date** | 19 July 2026 |
| **Repository** | `github.com/chamudi23/vercel_chamudi` (branch `chamudi`) |

---

## 1. Executive Summary

This week focused on transforming the Automated Skeletal Analysis module from a
functional prototype into a **complete, database-backed learning and analysis
platform**. Five major capabilities were delivered: a **Knowledge Base** with an
interactive visual guide, a **Coursera-style gated learning course**, **Google
authentication**, full **Supabase persistence**, and **email delivery of reports**.
A significant integration effort also reconciled two parallel development
branches into one coherent module. All work is committed and pushed to the
remote repository, and the production build passes.

**Overall status:** 🟢 On track — planned objectives met and exceeded.

---

## 2. Objectives for the Week

| # | Objective | Status |
|---|---|---|
| 1 | Build an educational Knowledge Base for the module | ✅ Completed |
| 2 | Create a structured, self-paced training course for new analysts | ✅ Completed |
| 3 | Add user authentication to track learners | ✅ Completed |
| 4 | Persist all module data in a cloud database (no browser-only storage) | ✅ Completed |
| 5 | Fix reporting defects and add report export/delivery | ✅ Completed |
| 6 | Reconcile divergent Git branches and consolidate the codebase | ✅ Completed |

---

## 3. Work Completed

### 3.1 Knowledge Base & Interactive Bone Feature Guide
- Built a **Knowledge Base hub** (`/skeletal/knowledge`) with featured entry points and reference articles (methodology, glossary, FAQ).
- Authored a **step-by-step New-Analysis Tutorial** with mock UI panels replicating each screen of the wizard.
- Developed an **interactive, auto-playing Bone Feature Guide** (`/skeletal/knowledge/guide`) presenting every skeletal feature the system reads (brow ridge, mastoid, jaw, cranial sutures, pelvis, femur, ribs, sternum, teeth) using **real specimen images**, with categories, Sex/Age/Height indicators, lightbox zoom, filmstrip and keyboard navigation.
- Content was compiled from the module's osteology reference material and mapped to the provided specimen imagery.

### 3.2 Learning Path — Gated Course with Quiz Checkpoints
- Implemented a **Coursera-style course** (`/skeletal/knowledge/course`) across **4 modules**: Foundations → Reading the Skull → The Rest of the Skeleton → Using the System.
- Each module ends with a **checkpoint quiz** that must be passed (≥ 70 %) to unlock the next module — enforcing sequential learning.
- Added a **curriculum sidebar** (locked / current / completed states), a **progress bar**, per-question feedback, retry support, and a **completion certificate**.

### 3.3 Google Authentication
- Integrated **Supabase Auth with Google OAuth** so learners sign in before taking the course.
- The **Google provider was configured and enabled** on the module's Supabase project, and sign-in verified.

### 3.4 Full Supabase Persistence
- Migrated all module data off browser storage into **Supabase (PostgreSQL)**.
- Created two tables with **Row-Level Security**: `analyses` (saved cases/reports) and `course_progress` (per-learner progress).
- Course progress now **follows each learner across devices**, keyed to their authenticated account.
- Provisioned a **dedicated Supabase project** (`jlqnqzlvpljntpnbdaci`) for this module via an isolated client, verified with live read/write tests.

### 3.5 Reporting — Defect Fix, PDF Export & Email Delivery
- **Fixed a defect** where past-analysis reports displayed empty: reports now load a specific case by **Case ID** from the database and survive page refresh.
- Added **PDF report download** (jsPDF).
- Added **email delivery**: clicking *Send Mail* opens a dialog for the recipient address and sends a **branded HTML report** from a fixed sender (`it22299802@my.sliit.lk`) via EmailJS, with a BCC copy retained by the sender.

### 3.6 Codebase Consolidation
- Reconciled a **diverged Git branch** (parallel work from another environment) via rebase, preserving both contributions.
- **Standardized the entire module** on a single data model and database, removing a duplicate service layer so the analysis wizard, dashboard, and reports all read/write the same source of truth.

---

## 4. Technical Implementation

| Area | Technology / Approach |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Routing | React Router DOM 7 |
| Authentication | Supabase Auth (Google OAuth) |
| Database | Supabase (PostgreSQL) with Row-Level Security |
| Charts | Recharts |
| PDF generation | jsPDF |
| Email delivery | EmailJS (HTML template, fixed sender) |
| Animations | Custom CSS keyframes + IntersectionObserver reveal hook |

**New architecture highlights**
- Dedicated Supabase client isolates this module's data from other OAHRIS modules.
- Analysis state flows through a single React context and is persisted **once**, at Step 3, into the `analyses` table.
- The dashboard, past-analysis list, and reports all derive from the same `analyses` source, guaranteeing consistency.

---

## 5. Testing & Verification

| Check | Result |
|---|---|
| Production build (`vite build`) | ✅ Passes |
| Supabase key validity (live API test) | ✅ 200 OK |
| Database read (seed cases) | ✅ Returned expected rows |
| Database write (insert + read-back) | ✅ HTTP 201, row confirmed |
| Google provider enabled | ✅ Confirmed via auth settings |
| Report loads by Case ID after refresh | ✅ Verified |

---

## 6. Challenges & Resolutions

| Challenge | Resolution |
|---|---|
| Reports appeared empty for saved analyses | Root-caused to non-persisted, ID-less data; introduced a Supabase-backed store and Case-ID routing. |
| App was pointed at the wrong Supabase project (401 errors) | Diagnosed via live API test; repointed to the correct project and verified read/write. |
| Two divergent Git histories with overlapping files | Rebased and manually resolved conflicts, keeping both sets of work coherent. |
| Two incompatible module implementations (two schemas/DBs) | Standardized on one implementation and one database across every screen. |
| Sending email from a fixed institutional address | Adopted EmailJS with the sender account connected server-side; browser holds only public keys. |

---

## 7. Version Control Activity

Commits pushed to `origin/chamudi` this week:

```
3ef29d2  Email report as HTML only (no PDF attachment)
5840408  Complete EmailJS config with Template ID and Public Key
0876776  Add EmailJS HTML report template; set Service ID
4f7ceca  Send report via email from a fixed sender (EmailJS)
74eb0d4  Standardize Skeletal module on this session's implementation
9623f26  Wire Knowledge Base/course routes and AuthProvider; revamp README
1a8cb67  Add gated Learning Path course with quiz checkpoints
274f81c  Add Knowledge Base: tutorial and animated Bone Feature Guide
10e059f  Fix empty past reports; add PDF download and Send Mail
d6c937a  Add Supabase-backed auth and persistence layer
```

---

## 8. Deliverables (Routes)

| Route | Deliverable |
|---|---|
| `/skeletal/knowledge` | Knowledge Base hub |
| `/skeletal/knowledge/guide` | Interactive animated Bone Feature Guide |
| `/skeletal/knowledge/tutorial` | New-Analysis Tutorial |
| `/skeletal/knowledge/course` | Gated Learning Path (Google login) |
| `/skeletal/analysis/new` → `step3` | Analysis wizard |
| `/skeletal/report/:caseId` | Prediction report (PDF + email) |
| `/skeletal/cases` | Past Analysis repository |
| `/skeletal/dashboard` | Statistics dashboard |

---

## 9. Plan for Next Week

- [ ] Add an **admin "learner progress" dashboard** (enrollment and completion tracking).
- [ ] Move committed secrets (`.env.local`) out of version control and rotate keys.
- [ ] Optionally unify remaining assets and finalize the report "Similar Cases" from live data.
- [ ] Prepare a **Pull Request** from `chamudi` → `main` for review/deployment.
- [ ] User-acceptance testing of the end-to-end analysis → report → email flow.

---

## 10. References

- Bass, W. M. (2005). *Human Osteology: A Laboratory and Field Manual* (5th ed.). Missouri Archaeological Society.
- White, T. D., Black, M. T., & Folkens, P. A. (2012). *Human Osteology* (3rd ed.). Academic Press.
- Buikstra, J. E., & Ubelaker, D. H. (1994). *Standards for Data Collection from Human Skeletal Remains.*

---

*Prepared by Chamudi Gayeshika (IT22299802) · OAHRIS — Automated Skeletal Analysis System · 19 July 2026*
