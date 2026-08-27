<div align="center">

# 🦴 OAHRIS
### Osteoarchaeological Research Information System

*A centralized digital platform for managing osteoarchaeological research data across 50,000 years of Sri Lankan prehistory.*

<br/>

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)

<br/>

`R26-ISE-006` · B.Sc. (Hons) Information Technology — Information System Engineering
**Sri Lanka Institute of Information Technology (SLIIT)**
In collaboration with the **Postgraduate Institute of Archaeology (PGIAR)**

</div>

---

## 📖 Overview

OAHRIS helps researchers **store, visualize, and analyze** excavation data, skeletal records, and burial‑site information. It brings together spatial mapping, machine‑assisted skeletal analysis, image management, and research analytics into one modern web application — filling the long‑standing gap of a centralized digital system for osteoarchaeology in Sri Lanka.

---

## 👥 Team & Modules

| Student ID | Name | Module |
|---|---|---|
| IT22159908 | Ilshan | Data Integration |
| IT21824210 | — | Image Management |
| **IT22299802** | **Chamudi Gayeshika** | **🧬 Skeletal Analysis System** |
| IT22299802 | Minuri | Research Analytics |

---

## 🧬 Skeletal Analysis System · `IT22299802 — Chamudi`

> AI‑assisted **biological‑profile estimation** (sex, age & height) from skeletal remains — plus a full learning ecosystem to train new analysts.

<div align="center">

`http://localhost:5173/skeletal`

</div>

### ✨ Highlights

<table>
<tr>
<td width="50%" valign="top">

#### 🔬 Analysis Engine
- **3‑step guided workflow** — basic info → measurements → prediction
- **Bone‑aware forms** — Skull, Pelvis, Upper/Lower Limb, Thorax, Teeth
- **Rule‑based predictions** using osteology standards & **Bass (2005)** stature formulae
- **Sex · Age range · Height · Confidence** with per‑case reasoning

</td>
<td width="50%" valign="top">

#### 📊 Reports & Records
- **Past Analysis** — searchable, filterable case repository
- **Prediction Report** per case (loads by Case ID)
- **⬇️ Download PDF** report (jsPDF)
- **✉️ Send Mail** — pre‑filled report e‑mail
- Every case **persisted in Supabase** — shared across devices

</td>
</tr>
<tr>
<td width="50%" valign="top">

#### 📚 Knowledge Base
- **Interactive, animated Bone Feature Guide** — auto‑playing tour of every feature with **real specimen images**, categories & what each predicts
- **Complete New‑Analysis Tutorial** — step‑by‑step visual walkthrough
- Reference tiles: methodology, glossary, FAQ

</td>
<td width="50%" valign="top">

#### 🎓 Learning Path *(Coursera‑style)*
- **Gated course** — pass each **checkpoint quiz** to unlock the next module
- **🔐 Google Login** (Supabase Auth)
- **Per‑learner progress tracking** stored in Supabase — follows you across devices
- **Certificate** on completion

</td>
</tr>
</table>

### 🗺️ Skeletal Module Routes

| Route | Page |
|---|---|
| `/skeletal` | Module overview |
| `/skeletal/dashboard` | Dashboard & statistics |
| `/skeletal/analysis/new` → `step2` → `step3` | New Analysis wizard |
| `/skeletal/report/:caseId` | Prediction report (PDF / mail) |
| `/skeletal/cases` | Past Analysis repository |
| `/skeletal/knowledge` | Knowledge Base hub |
| `/skeletal/knowledge/course` | 🎓 Learning Path (Google login) |
| `/skeletal/knowledge/guide` | 🦴 Animated Bone Feature Guide |
| `/skeletal/knowledge/tutorial` | 📘 New‑Analysis Tutorial |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · Vite 5 · Tailwind CSS 3 |
| Routing | React Router DOM 7 |
| Auth & Database | **Supabase** (Google OAuth + PostgreSQL) |
| Charts | Recharts |
| GIS / Mapping | Leaflet · React‑Leaflet |
| AI Clustering | DBSCAN (`density-clustering`) |
| PDF | jsPDF |
| Icons | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- A **Supabase** project (free tier is fine)

### 1 · Install & run

```bash
git clone https://github.com/chamudi23/vercel_chamudi.git
cd vercel_chamudi
npm install
npm run dev
```

Open **http://localhost:5173** 🎉

### 2 · Connect Supabase

The client reads its config from `src/supabase.js`, overridable via a `.env`:

```bash
# .env  (optional — falls back to values in src/supabase.js)
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
```

> The **anon** key is safe in the client — every table is protected by Row‑Level Security.

### 3 · Create the database tables

In the Supabase dashboard → **SQL Editor**, run [`kgc_supabase_setup.sql`](./kgc_supabase_setup.sql). It creates:

- **`analyses`** — saved skeletal analyses / reports (with demo seed data)
- **`course_progress`** — per‑learner Learning Path progress (RLS: each learner sees only their own row)

### 4 · Enable Google login *(for the Learning Path)*

1. **Google Cloud Console** → create an **OAuth 2.0 Web client**
   Authorized redirect URI → `https://<your-project>.supabase.co/auth/v1/callback`
2. **Supabase** → Authentication → **Providers → Google** → paste Client ID + Secret → enable
3. **Supabase** → Authentication → **URL Configuration**
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**`

> 🔒 Keep your Google **client secret** private — it lives only in Supabase's provider settings, never in the frontend.

---

## 📁 Project Structure

```
src/
├─ pages/
│  ├─ KgcSkeletalModulePage.jsx      # Skeletal module overview
│  ├─ KgcDashboard.jsx               # Dashboard & stats
│  ├─ KgcReport.jsx                  # Report (PDF + Send Mail)
│  ├─ KgcPastAnalysis.jsx            # Case repository (Supabase)
│  ├─ NewAnalysis/                   # 3-step analysis wizard
│  └─ Knowledge/
│     ├─ KgcKnowledgeBase.jsx        # Knowledge hub
│     ├─ KgcNewAnalysisTutorial.jsx  # Visual tutorial
│     ├─ KgcBoneFeatureGuide.jsx     # Animated, image-based guide
│     ├─ KgcCourse.jsx               # Gated Learning Path + Google login
│     ├─ kbGuideData.js              # Bone feature content
│     └─ kgcCourseData.js            # Course modules + quizzes
├─ context/
│  ├─ AnalysisContext.jsx            # New-analysis state
│  └─ AuthContext.jsx                # Supabase Google auth
├─ hooks/
│  ├─ useCourseProgress.js           # Per-learner progress (Supabase)
│  └─ useReveal.js                   # Scroll-reveal animations
├─ lib/
│  └─ analysisStore.js               # Supabase CRUD for analyses
├─ supabase.js                       # Supabase client
└─ App.jsx                           # Routes & providers

public/kb/                           # Specimen images for the guide
kgc_supabase_setup.sql               # DB tables + RLS + seed data
```

---

## 🗄️ Data Model

<details>
<summary><b>analyses</b> — saved skeletal cases</summary>

| Column | Type | Description |
|---|---|---|
| `case_id` | text (PK) | e.g. `KGC-20260210-1042` |
| `basic_info` | jsonb | investigator, location, dates, bone type |
| `measurements` | jsonb | recorded skeletal measurements |
| `predictions` | jsonb | gender, age range, height, confidence |
| `created_at` | timestamptz | saved time |

</details>

<details>
<summary><b>course_progress</b> — per-learner Learning Path progress</summary>

| Column | Type | Description |
|---|---|---|
| `user_id` | uuid (PK) | references `auth.users` |
| `completed` | jsonb | list of completed step IDs |
| `updated_at` | timestamptz | last update |

*Row‑Level Security ensures each learner can read/write only their own row.*

</details>

---

## 📚 References

- Bass, W. M. (2005). *Human Osteology: A Laboratory and Field Manual* (5th ed.). Missouri Archaeological Society.
- White, T. D., Black, M. T., & Folkens, P. A. (2012). *Human Osteology* (3rd ed.). Academic Press.
- Buikstra, J. E., & Ubelaker, D. H. (1994). *Standards for Data Collection from Human Skeletal Remains.*
- Conolly, J. & Lake, M. (2006). *Geographical Information Systems in Archaeology.* Cambridge University Press.

---

## 📄 License

Developed for academic research at **SLIIT** under the supervision of **Mrs. Buddhima Attanayake**.

> ⚠️ Predictions are **supportive estimates** and should always be confirmed by a trained professional.

<div align="center">

*Made with 🦴 for Sri Lankan osteoarchaeology*

</div>
