# OAHRIS — Skeletal Analysis Module: Supabase Integration Plan

> **Module Owner:** Chamudi (IT22299802)  
> **Module:** Automated Skeletal Analysis (KGC)  
> **Date:** May 2026  
> **Frontend:** Vite + React (hosted on Vercel)  
> **Backend:** Supabase (PostgreSQL)

---

## 1. Overview

This document describes how the **Automated Skeletal Analysis** frontend connects to the **Supabase** database to persist all analysis data. The system follows a 3-step wizard flow where each step saves data to the relevant database tables in real time.

---

## 2. System Architecture

```mermaid
graph TB
    subgraph Frontend ["Frontend (Vite + React — Vercel)"]
        A[Step 1: Basic Info] --> B[Step 2: Measurements]
        B --> C[Step 3: Review & Predict]
        C --> D[Report Page]
        E[Dashboard] 
        F[Past Analysis]
    end

    subgraph Service ["Service Layer (supabaseService.js)"]
        S1["upsertInvestigator()"]
        S2["saveCase()"]
        S3["saveMeasurements()"]
        S4["savePrediction()"]
        S5["updateCaseStatus()"]
        S6["fetchAllCases()"]
        S7["fetchDashboardStats()"]
        S8["fetchSimilarCases()"]
    end

    subgraph Supabase ["Supabase (PostgreSQL)"]
        T1[(kgc_investigators)]
        T2[(kgc_cases)]
        T3[(kgc_skull_measurements)]
        T4[(kgc_pelvis_measurements)]
        T5[(kgc_limb_measurements)]
        T6[(kgc_thorax_measurements)]
        T7[(kgc_teeth_measurements)]
        T8[(kgc_predictions)]
    end

    A --> S1 --> T1
    A --> S2 --> T2
    B --> S3 --> T3 & T4 & T5 & T6 & T7
    C --> S4 --> T8
    C --> S5 --> T2
    E --> S7 --> T2 & T8
    E --> S6 --> T2
    F --> S6 --> T2
    D --> S8 --> T2
```

---

## 3. Data Flow — Sequence Diagram

This diagram shows exactly what happens when a user completes a full analysis:

```mermaid
sequenceDiagram
    actor User
    participant Step1 as Step 1<br/>(Basic Info)
    participant Step2 as Step 2<br/>(Measurements)
    participant Step3 as Step 3<br/>(Review & Predict)
    participant SVC as supabaseService.js
    participant DB as Supabase DB

    Note over User, DB: STEP 1 — Basic Information

    User->>Step1: Fill form & click "Next →"
    Step1->>SVC: upsertInvestigator(name, email)
    SVC->>DB: SELECT / INSERT → kgc_investigators
    DB-->>SVC: investigator_id (UUID)
    Step1->>SVC: saveCase(caseId, investigatorId, boneType, location, ...)
    SVC->>DB: INSERT → kgc_cases (status: 'in_progress')
    DB-->>SVC: case row
    Step1->>Step2: Navigate with bonesType query param

    Note over User, DB: STEP 2 — Skeletal Measurements

    User->>Step2: Fill measurements & click "Next →"
    Step2->>SVC: saveMeasurements(caseId, boneType, data)
    
    alt boneType = Skull
        SVC->>DB: INSERT → kgc_skull_measurements
    else boneType = Pelvis
        SVC->>DB: INSERT → kgc_pelvis_measurements
    else boneType = Lower Limb / Upper Limb
        SVC->>DB: INSERT → kgc_limb_measurements
    else boneType = Thorax
        SVC->>DB: INSERT → kgc_thorax_measurements
    else boneType = Teeth
        SVC->>DB: INSERT → kgc_teeth_measurements
    end

    DB-->>SVC: measurement row
    Step2->>Step3: Navigate with bonesType

    Note over User, DB: STEP 3 — Review & Generate Report

    User->>Step3: Review predictions & click "Generate Report →"
    Step3->>SVC: savePrediction(caseId, predictions)
    SVC->>DB: INSERT → kgc_predictions (sex, age, height, confidence)
    DB-->>SVC: prediction row
    Step3->>SVC: updateCaseStatus(caseId, 'completed')
    SVC->>DB: UPDATE → kgc_cases SET status = 'completed'
    DB-->>SVC: updated case
    Step3->>User: Navigate to Report page
```

---

## 4. Entity Relationship Diagram

```mermaid
erDiagram
    kgc_investigators {
        UUID id PK
        VARCHAR name
        VARCHAR email UK
        VARCHAR role
        VARCHAR institution
        TIMESTAMPTZ created_at
    }

    kgc_cases {
        VARCHAR case_id PK
        UUID investigator_id FK
        VARCHAR bone_type
        VARCHAR location
        DATE date_found
        DATE analysis_date
        VARCHAR status
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    kgc_skull_measurements {
        UUID id PK
        VARCHAR case_id FK
        VARCHAR brow_ridge
        VARCHAR mastoid_size
        VARCHAR jaw_shape
        VARCHAR cranial_suture
        TIMESTAMPTZ created_at
    }

    kgc_pelvis_measurements {
        UUID id PK
        VARCHAR case_id FK
        VARCHAR subpubic_angle
        VARCHAR sciatic_notch
        VARCHAR pubic_symphysis
        TIMESTAMPTZ created_at
    }

    kgc_limb_measurements {
        UUID id PK
        VARCHAR case_id FK
        VARCHAR limb_type
        DECIMAL femur_length
        DECIMAL femur_head_diameter
        VARCHAR growth_plate
        DECIMAL humerus_length
        VARCHAR bone_robusticity
        TIMESTAMPTZ created_at
    }

    kgc_thorax_measurements {
        UUID id PK
        VARCHAR case_id FK
        VARCHAR rib_shape
        DECIMAL sternum_length
        TIMESTAMPTZ created_at
    }

    kgc_teeth_measurements {
        UUID id PK
        VARCHAR case_id FK
        VARCHAR teeth_type
        VARCHAR dental_wear
        VARCHAR eruption_stage
        TIMESTAMPTZ created_at
    }

    kgc_predictions {
        UUID id PK
        VARCHAR case_id FK
        VARCHAR predicted_sex
        VARCHAR age_range
        VARCHAR estimated_height
        DECIMAL confidence
        VARCHAR methodology
        VARCHAR formula_used
        TIMESTAMPTZ created_at
    }

    kgc_case_images {
        UUID id PK
        VARCHAR case_id FK
        TEXT image_url
        VARCHAR image_type
        TEXT description
        TIMESTAMPTZ uploaded_at
    }

    kgc_investigators ||--o{ kgc_cases : "conducts"
    kgc_cases ||--o| kgc_skull_measurements : "has"
    kgc_cases ||--o| kgc_pelvis_measurements : "has"
    kgc_cases ||--o| kgc_limb_measurements : "has"
    kgc_cases ||--o| kgc_thorax_measurements : "has"
    kgc_cases ||--o| kgc_teeth_measurements : "has"
    kgc_cases ||--o{ kgc_predictions : "produces"
    kgc_cases ||--o{ kgc_case_images : "contains"
```

---

## 5. Table-to-Step Mapping

| Analysis Step | Frontend Component | Service Function | Database Table | Operation |
|---|---|---|---|---|
| Step 1 — Basic Info | `KgcStep1BasicInfo.jsx` | `upsertInvestigator()` | `kgc_investigators` | Find or Create |
| Step 1 — Basic Info | `KgcStep1BasicInfo.jsx` | `saveCase()` | `kgc_cases` | INSERT (status: `in_progress`) |
| Step 2 — Skull | `KgcStep2Measurements.jsx` | `saveMeasurements()` | `kgc_skull_measurements` | INSERT |
| Step 2 — Pelvis | `KgcStep2Measurements.jsx` | `saveMeasurements()` | `kgc_pelvis_measurements` | INSERT |
| Step 2 — Lower Limb | `KgcStep2Measurements.jsx` | `saveMeasurements()` | `kgc_limb_measurements` | INSERT (limb_type: `lower`) |
| Step 2 — Upper Limb | `KgcStep2Measurements.jsx` | `saveMeasurements()` | `kgc_limb_measurements` | INSERT (limb_type: `upper`) |
| Step 2 — Thorax | `KgcStep2Measurements.jsx` | `saveMeasurements()` | `kgc_thorax_measurements` | INSERT |
| Step 2 — Teeth | `KgcStep2Measurements.jsx` | `saveMeasurements()` | `kgc_teeth_measurements` | INSERT |
| Step 3 — Predict | `KgcStep3Review.jsx` | `savePrediction()` | `kgc_predictions` | INSERT |
| Step 3 — Complete | `KgcStep3Review.jsx` | `updateCaseStatus()` | `kgc_cases` | UPDATE (status: `completed`) |
| Dashboard | `KgcDashboard.jsx` | `fetchDashboardStats()` | `kgc_cases`, `kgc_predictions` | SELECT + aggregate |
| Past Analysis | `KgcPastAnalysis.jsx` | `fetchAllCases()` | `kgc_cases` | SELECT |
| Report | `KgcReport.jsx` | `fetchSimilarCases()` | `kgc_cases` | SELECT (by bone_type) |

---

## 6. Field Mapping — Frontend ↔ Database

### Step 1: Basic Info → `kgc_cases`

| Frontend Field (camelCase) | Database Column (snake_case) | Type |
|---|---|---|
| `currentCaseId` | `case_id` | VARCHAR(20) PK |
| *(from investigator)* | `investigator_id` | UUID FK |
| `bonesType` | `bone_type` | VARCHAR(20) |
| `location` | `location` | VARCHAR(200) |
| `dateFound` | `date_found` | DATE |
| `analysisDate` | `analysis_date` | DATE |
| *(auto)* | `status` | VARCHAR(20) — `in_progress` |

### Step 2: Skull → `kgc_skull_measurements`

| Frontend Field | Database Column | Values |
|---|---|---|
| `browRidge` | `brow_ridge` | smooth, less-developed, moderate, prominent, thick |
| `mastoidSize` | `mastoid_size` | less-25mm, 25-30mm, more-30mm |
| `jawShape` | `jaw_shape` | u-shaped, v-shaped, robust, rounded |
| `cranialSuture` | `cranial_suture` | open, partially-open, moderate-closure, mostly-closed, completely-closed |

### Step 2: Pelvis → `kgc_pelvis_measurements`

| Frontend Field | Database Column | Values |
|---|---|---|
| `subpubicAngle` | `subpubic_angle` | wide, narrow |
| `sciaticNotch` | `sciatic_notch` | wide, narrow |
| `pubicSymphysis` | `pubic_symphysis` | smooth-flat, moderate-flat-ridges, rough-granular, degenerated-eroded |

### Step 2: Lower Limb → `kgc_limb_measurements`

| Frontend Field | Database Column | Type |
|---|---|---|
| *(auto)* | `limb_type` | `'lower'` |
| `femurLength` | `femur_length` | DECIMAL(6,1) mm |
| `femurHeadDiameter` | `femur_head_diameter` | DECIMAL(5,1) mm |
| `growthPlate` | `growth_plate` | fused, partially-fused, unfused |

### Step 2: Upper Limb → `kgc_limb_measurements`

| Frontend Field | Database Column | Type |
|---|---|---|
| *(auto)* | `limb_type` | `'upper'` |
| `humerusLength` | `humerus_length` | DECIMAL(6,1) mm |
| `boneRobusticity` | `bone_robusticity` | robust, gracile |

### Step 2: Thorax → `kgc_thorax_measurements`

| Frontend Field | Database Column | Type |
|---|---|---|
| `ribShape` | `rib_shape` | smooth, scalloped, irregular |
| `sternumLength` | `sternum_length` | DECIMAL(5,1) mm |

### Step 2: Teeth → `kgc_teeth_measurements`

| Frontend Field | Database Column | Values |
|---|---|---|
| `teethType` | `teeth_type` | deciduous, permanent, mixed |
| `dentalWear` | `dental_wear` | none, mild, moderate, severe |
| `eruptionStage` | `eruption_stage` | early, partial, complete |

### Step 3: Predictions → `kgc_predictions`

| Frontend Field | Database Column | Notes |
|---|---|---|
| `gender` | `predicted_sex` | Male, Female, Indeterminate |
| `ageRange` | `age_range` | e.g. "18 - 25", "35 - 45" |
| `height` | `estimated_height` | e.g. "169.3 cm" or "Unknown" |
| `confidence` | `confidence` | DECIMAL — % stripped (e.g. 94.0) |
| *(auto)* | `methodology` | `'Bass 2005'` |

---

## 7. Connection Setup

### Framework
- **Vite + React** (NOT Next.js)
- **Client library:** `@supabase/supabase-js` v2
- **No SSR needed** — `@supabase/ssr` is NOT required

### Environment Variables (`.env.local`)

```env
VITE_SUPABASE_URL=https://siyqkcnnicsdnztquahf.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Supabase Client (`src/supabase.js`)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

---

## 8. Security — Row Level Security (RLS)

Since the app does **not** have user authentication, all requests use the Supabase **anon** key. Anon RLS policies must be enabled on all `kgc_*` tables:

```sql
-- SELECT (read) for all tables
CREATE POLICY "kgc_anon_select_cases" ON kgc_cases FOR SELECT TO anon USING (true);
-- ... (repeat for all 9 tables)

-- INSERT (write) for all tables
CREATE POLICY "kgc_anon_insert_cases" ON kgc_cases FOR INSERT TO anon WITH CHECK (true);
-- ... (repeat for all 9 tables)

-- UPDATE for kgc_cases (status changes)
CREATE POLICY "kgc_anon_update_cases" ON kgc_cases FOR UPDATE TO anon USING (true) WITH CHECK (true);
```

---

## 9. Project File Structure

```
vercel_chamudi/
├── .env.local                          ← Supabase credentials
├── src/
│   ├── supabase.js                     ← Supabase client
│   ├── services/
│   │   └── supabaseService.js          ← All DB operations (NEW)
│   ├── context/
│   │   └── AnalysisContext.jsx         ← React state (in-memory)
│   ├── pages/
│   │   ├── NewAnalysis/
│   │   │   ├── KgcStep1BasicInfo.jsx   ← Saves case + investigator
│   │   │   ├── KgcStep2Measurements.jsx← Saves measurements
│   │   │   └── KgcStep3Review.jsx      ← Saves predictions
│   │   ├── KgcDashboard.jsx            ← Live stats from DB
│   │   ├── KgcPastAnalysis.jsx         ← All cases from DB
│   │   └── KgcReport.jsx              ← Similar cases from DB
│   └── ...
├── kgc_database_schema.sql             ← SQL schema
└── package.json
```

---

## 10. Deployment Checklist

- [x] Tables created in Supabase (via `kgc_database_schema.sql`)
- [x] Anon RLS policies added
- [x] `@supabase/supabase-js` installed
- [x] `supabaseService.js` created with all DB operations
- [x] Step 1/2/3 save data on form submit
- [x] Dashboard reads live statistics
- [x] Past Analysis reads all cases
- [x] Build passes (0 errors)
- [x] Browser test passed — full flow verified
- [ ] Set env vars in Vercel Dashboard
- [ ] Push to Git → auto-deploy

---

*Generated: May 2026 | OAHRIS Skeletal Analysis Module*
