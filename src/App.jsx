import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ImageSearchPage from './pages/ImageSearchPage'
import ImageUploadPage from './pages/ImageUploadPage'
import ImageDetailPage from './pages/ImageDetailPage'
import AIAssistantPage from './pages/AIAssistantPage'
import SkeletonViewerPage from './pages/SkeletonViewerPage'
import IlshanModulePage from './pages/IlshanModulePage'
import MinuriModulePage from "./pages/MinuriModulePage";
import SpecimenFormPage from "./pages/SpecimenFormPage";
import ParamiModulePage from "./pages/ParamiModulePage";
import SitesListPage from "./pages/SitesListPage";
import SpecimenListPage from "./pages/SpecimenListPage";
import SpecimenDetailPage from "./pages/SpecimenDetailPage";
import DataImportPage from "./pages/DataImportPage";
import DataQualityPage from "./pages/DataQualityPage";
import ImageDocumentationDashboardPage from './pages/ImageDocumentationDashboardPage'
import SiteDetailPage from "./pages/SiteDetailPage";
import AddSitePage from "./pages/AddSitePage";
import ViewSitesPage from "./pages/ViewSitesPage";
import SiteDetailsPage from "./pages/SiteDetailsPage";
import AddStorageLocationPage from "./pages/AddStorageLocationPage";
import ViewStorageLocationsPage from "./pages/ViewStorageLocationsPage";
import SimilarFindingsPage from "./pages/SimilarFindingsPage";
import GISHome from "./pages/GISHome";

// Skeletal Module imports
import SkeletalModulePage from './pages/KgcSkeletalModulePage';
import SkeletalDashboard from './pages/KgcDashboard';
import SkeletalStep1 from './pages/NewAnalysis/KgcStep1BasicInfo';
import SkeletalStep2 from './pages/NewAnalysis/KgcStep2Measurements';
import SkeletalStep3 from './pages/NewAnalysis/KgcStep3Review';
import SkeletalReport from './pages/KgcReport';
import SkeletalPastAnalysis from './pages/KgcPastAnalysis';
import SkeletalKnowledgeBase from './pages/Knowledge/KgcKnowledgeBase';
import SkeletalNewAnalysisTutorial from './pages/Knowledge/KgcNewAnalysisTutorial';
import SkeletalBoneFeatureGuide from './pages/Knowledge/KgcBoneFeatureGuide';
import SkeletalCourse from './pages/Knowledge/KgcCourse';
import SkeletalLearnerProgress from './pages/Knowledge/KgcLearnerProgress';

// Access control
import PublicLandingPage from './pages/PublicLandingPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import { RequireAuth, RequireRole, CURATOR_ROLES, ADMIN_ROLES } from './components/auth/AuthGuards';

import { AnalysisProvider } from './context/AnalysisContext';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

/**
 * Route gating
 * ============
 * Three tiers, mirroring the permission matrix in ACCESS_CONTROL_PLAN.md:
 *
 *   <RequireAuth>                      any active account — read access
 *   <RequireRole roles={CURATOR_ROLES}> admin + researcher — creates and edits
 *   <RequireRole roles={ADMIN_ROLES}>   admin — user management
 *
 * Note this gates ROUTES, not module internals. No module page was modified:
 * each is wrapped where it is mounted, so the four modules keep their own
 * structure and can be worked on independently.
 *
 * These guards are UX. The database enforces the same rules via RLS
 * (access_control/02_rls_lockdown.sql) — a student who reaches a curator route
 * by editing the bundle still meets a database that refuses the write.
 */

/** Any signed-in, active user. */
const Auth = ({ children }) => <RequireAuth>{children}</RequireAuth>
/** Admin or researcher — may create and edit records. */
const Curator = ({ children }) => <RequireRole roles={CURATOR_ROLES}>{children}</RequireRole>
/** Admin only. */
const Admin = ({ children }) => <RequireRole roles={ADMIN_ROLES}>{children}</RequireRole>

function ApplicationRoutes() {
  return (
    <Routes>
      {/* ---------------- Public — no account required ---------------- */}
      <Route path="/" element={<PublicLandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ---------------- Module launcher (was "/") ------------------- */}
      <Route path="/app" element={<Auth><HomePage /></Auth>} />

      {/* ---------------- Image Documentation ------------------------- */}
      <Route path="/gallery" element={<Auth><ImageSearchPage /></Auth>} />
      <Route path="/image-dashboard" element={<Auth><ImageDocumentationDashboardPage /></Auth>} />
      <Route path="/search" element={<Auth><ImageSearchPage /></Auth>} />
      <Route path="/image/:imageId" element={<Auth><ImageDetailPage /></Auth>} />
      <Route path="/skeleton" element={<Auth><SkeletonViewerPage /></Auth>} />
      <Route path="/module" element={<Auth><IlshanModulePage /></Auth>} />
      <Route path="/image-documentation" element={<Auth><IlshanModulePage /></Auth>} />
      <Route path="/ai-assistant" element={<Auth><AIAssistantPage /></Auth>} />
      <Route path="/analysis" element={<Auth><AIAssistantPage /></Auth>} />
      {/* Uploading adds to the shared record — curators only. */}
      <Route path="/upload" element={<Curator><ImageUploadPage /></Curator>} />

      {/* ---------------- Centralized Specimen Records ---------------- */}
      <Route path="/minuri" element={<Auth><MinuriModulePage /></Auth>} />
      <Route path="/data-management" element={<Auth><MinuriModulePage /></Auth>} />
      <Route path="/specimens" element={<Auth><SpecimenListPage /></Auth>} />
      {/* "/specimens/add" must precede "/specimens/:id" or it is captured. */}
      <Route path="/specimens/add" element={<Curator><SpecimenFormPage /></Curator>} />
      <Route path="/specimens/import" element={<Curator><DataImportPage /></Curator>} />
      <Route path="/specimens/:id" element={<Auth><SpecimenDetailPage /></Auth>} />
      <Route path="/sites/add" element={<Curator><AddSitePage /></Curator>} />
      <Route path="/sites/edit/:siteId" element={<Curator><AddSitePage /></Curator>} />
      <Route path="/minuri/sites" element={<Auth><ViewSitesPage /></Auth>} />
      <Route path="/minuri/sites/:siteId" element={<Auth><SiteDetailsPage /></Auth>} />
      <Route path="/minuri/storage-locations" element={<Auth><ViewStorageLocationsPage /></Auth>} />
      <Route path="/minuri/storage-locations/add" element={<Curator><AddStorageLocationPage /></Curator>} />
      <Route path="/minuri/storage-locations/edit/:locationId" element={<Curator><AddStorageLocationPage /></Curator>} />
      <Route path="/data-quality" element={<Curator><DataQualityPage /></Curator>} />

      {/* ---------------- GIS Spatial Analysis ------------------------ */}
      <Route path="/parami" element={<Auth><ParamiModulePage /></Auth>} />
      <Route path="/parami/sites" element={<Auth><SitesListPage /></Auth>} />
      <Route path="/spatial-analysis" element={<Auth><ParamiModulePage /></Auth>} />
      <Route path="/parami/home" element={<Auth><GISHome /></Auth>} />
      <Route path="/parami/site/:siteId" element={<Auth><SiteDetailPage /></Auth>} />
      <Route path="/parami/similar-findings" element={<Auth><SimilarFindingsPage /></Auth>} />

      {/* ---------------- Automated Skeletal Analysis -----------------
          Students have full use of this module, including running analyses
          and the Learning Path — it is their primary tool. */}
      <Route path="/skeletal" element={<Auth><SkeletalModulePage /></Auth>} />
      <Route path="/skeletal/dashboard" element={<Auth><SkeletalDashboard /></Auth>} />
      <Route path="/skeletal/analysis/new" element={<Auth><SkeletalStep1 /></Auth>} />
      <Route path="/skeletal/analysis/step2" element={<Auth><SkeletalStep2 /></Auth>} />
      <Route path="/skeletal/analysis/step3" element={<Auth><SkeletalStep3 /></Auth>} />
      <Route path="/skeletal/report" element={<Auth><SkeletalReport /></Auth>} />
      <Route path="/skeletal/report/:caseId" element={<Auth><SkeletalReport /></Auth>} />
      <Route path="/skeletal/cases" element={<Auth><SkeletalPastAnalysis /></Auth>} />
      <Route path="/skeletal/knowledge" element={<Auth><SkeletalKnowledgeBase /></Auth>} />
      <Route path="/skeletal/knowledge/tutorial" element={<Auth><SkeletalNewAnalysisTutorial /></Auth>} />
      <Route path="/skeletal/knowledge/guide" element={<Auth><SkeletalBoneFeatureGuide /></Auth>} />
      <Route path="/skeletal/knowledge/course" element={<Auth><SkeletalCourse /></Auth>} />
      {/* Other learners' progress — administrators only. */}
      <Route path="/skeletal/admin/learners" element={<Admin><SkeletalLearnerProgress /></Admin>} />

      {/* ---------------- Administration ------------------------------ */}
      <Route path="/admin/users" element={<Admin><AdminUsersPage /></Admin>} />
    </Routes>
  )
}

/** Routes that render their own full-page chrome, without the app shell. */
const BARE_ROUTES = ['/', '/login', '/reset-password']

function AppContent() {
  const { pathname } = useLocation()

  // The Skeletal module and the public/auth pages bring their own layout.
  const isBare = BARE_ROUTES.includes(pathname) || pathname.startsWith('/skeletal')

  if (isBare) {
    return <ApplicationRoutes />
  }

  return (
    <AppLayout>
      <ApplicationRoutes />
    </AppLayout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AnalysisProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AnalysisProvider>
    </AuthProvider>
  )
}

export default App
