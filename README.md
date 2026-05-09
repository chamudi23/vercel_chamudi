# OAHRIS — Osteoarchaeological Research Information System

> R26-ISE-006 | B.Sc. (Hons) Information Technology — Information System Engineering  
> Sri Lanka Institute of Information Technology (SLIIT)

---

## 📌 Project Overview

OAHRIS is a centralized digital platform for managing osteoarchaeological research data in Sri Lanka. It is developed in collaboration with the **Postgraduate Institute of Archaeology (PGIAR)** and supports researchers in storing, visualizing, and analyzing excavation data, skeletal records, and burial site information spanning over 50,000 years of Sri Lankan prehistory.

---

## 👥 Team Members & Modules

| Student ID | Name | Module |
|---|---|---|
| IT22159908 | Ilshan | Data Integration Module |
| **IT22889874** | **Parami K K J** | **GIS Spatial Analysis Module** |
| IT21824210 | — | Image Management Module |
| IT22299802 | Minuri | Research Analytics Module |

---

## 🗺️ Module 3.2 — GIS Spatial Analysis (IT22889874)

This module provides geographic and temporal visualization of osteoarchaeological data across Sri Lanka.

### Features

- **Interactive GIS Map** — Leaflet-based map showing all archaeological excavation sites across Sri Lanka with color-coded risk level markers (High / Medium / Low)
- **Temporal Layer Filter** — Filter map markers by excavation time period across 5 historical phases:
  - All Periods (50,000 BP – Present)
  - Prehistoric (50,000 – 1,000 BC)
  - Early Historic (1,000 – 0 BC)
  - Classical Period (0 – 1200 AD)
  - Medieval & Modern (1200 – Present)
- **AI Spatial Pattern Detection** — DBSCAN (Density-Based Spatial Clustering of Applications with Noise) algorithm that automatically detects clusters of burial sites. Adjustable parameters:
  - Search radius (ε) — controls how far apart sites can be to belong to the same cluster
  - Minimum points — minimum number of sites to form a cluster
- **Site Statistics Dashboard** — Total sites, sites shown, clusters found, high risk count, protected sites
- **District & Type Breakdown** — Visual summary of sites grouped by district and site type
- **Mapped Sites Table** — Full list of sites with coordinates, risk level, and cluster assignment

### Route
Access this module at: `http://localhost:5173/parami`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router DOM |
| GIS Mapping | Leaflet, React-Leaflet |
| AI Clustering | DBSCAN (density-clustering) |
| Database | Supabase (PostgreSQL) |
| Language | JavaScript |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or above
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/it21824210/oahris-research-project.git

# Navigate into the project
cd oahris-research-project

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser and go to `http://localhost:5173`

---

## 📁 Project Structure

```
src/
  pages/
    ParamiModulePage.jsx     ← GIS Spatial Analysis (IT22889874)
    IlshanModulePage.jsx     ← Data Integration
    MinuriModulePage.jsx     ← Research Analytics
    HomePage.jsx
    BonePage.jsx
    BoneDetailPage.jsx
    ImageSearchPage.jsx
    SkeletonViewerPage.jsx
  supabase.js                ← Supabase client config
  App.jsx                    ← Routes & navigation
  main.jsx
```

---

## 🗄️ Database Schema (sites table)

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| site_name | varchar | Name of the archaeological site |
| district | varchar | District in Sri Lanka |
| province | varchar | Province |
| latitude | numeric | GPS latitude |
| longitude | numeric | GPS longitude |
| time_period | varchar | Historical period of the site |
| site_type | varchar | Type (Cave Site, Burial Ground, etc.) |
| risk_level | varchar | High / Medium / Low |
| protected_status | boolean | Whether the site is legally protected |

---

## 🔬 Research Background

Osteoarchaeological research in Sri Lanka, conducted by institutions such as PGIAR, involves the study of human evolution and burial practices spanning 50,000 years. This GIS module addresses the key research gap of lacking a centralized digital system that integrates:

- Detailed spatial mapping of burial sites
- Dynamic temporal layers across excavation phases  
- Intelligent AI pattern recognition using clustering algorithms

---

## 📡 Backend GIS API Endpoints

Run `node server.js` in the `/backend` folder to enable:

```
GET /api/gis/sites/map
GET /api/gis/sites/temporal
GET /api/gis/sites/cluster-data
GET /api/gis/sites/by-district
GET /api/gis/sites/excavation-phases
GET /api/gis/spatial-stats
```

---

## 📚 References

- Conolly, J. & Lake, M. (2006). *Geographical Information Systems in Archaeology*. Cambridge University Press.
- Menéndez-Marsh et al. (2023). Geographic Information Systems in Archaeology: A Systematic Review. *Journal of Computer Applications in Archaeology*, 6(1).
- Wheatley, D. & Gillings, M. (2002). *Spatial Technology and Archaeology*. Taylor & Francis.

---

## 📄 License

This project is developed for academic research purposes at SLIIT under the supervision of Mrs. Buddhima Attanayake.
