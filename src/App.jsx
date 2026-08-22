/* eslint-disable react/prop-types */
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
import SpecimenListPage from "./pages/SpecimenListPage";
import SpecimenDetailPage from "./pages/SpecimenDetailPage";
import DataImportPage from "./pages/DataImportPage";
import DataQualityPage from "./pages/DataQualityPage";
import SiteDetailPage from "./pages/SiteDetailPage";
import AddSitePage from "./pages/AddSitePage";
import SimilarFindingsPage from "./pages/SimilarFindingsPage";
import AddSpecimenPage from "./pages/AddSpecimenPage";
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
import { AnalysisProvider } from './context/AnalysisContext';
import { AuthProvider } from './context/AuthContext';
import { AppAuthProvider } from './context/AppAuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminApprovalsPage from './pages/AdminApprovalsPage';

// Role sets, so the intent of each route is readable at a glance below.
const ANY_ROLE = null // any signed-in user (admin, researcher, or student)
const ADMIN = ['admin']
const RESEARCHER = ['researcher']
const RESEARCHER_STUDENT = ['researcher', 'student']
const ADMIN_RESEARCHER = ['admin', 'researcher']

function Guard({ roles, children }) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>
}

function ApplicationRoutes() {
  return (
    <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Main OAHRIS Routes */}
          <Route path="/" element={<Guard roles={ANY_ROLE}><HomePage /></Guard>} />

          {/* Skeletal Image Documentation (Ilshan) — Researcher full, Student view */}
          <Route path="/upload" element={<Guard roles={RESEARCHER}><ImageUploadPage /></Guard>} />
          <Route path="/gallery" element={<Guard roles={RESEARCHER_STUDENT}><ImageSearchPage /></Guard>} />
          <Route path="/image/:imageId" element={<Guard roles={RESEARCHER_STUDENT}><ImageDetailPage /></Guard>} />
          <Route path="/search" element={<Guard roles={RESEARCHER_STUDENT}><ImageSearchPage /></Guard>} />
          <Route path="/module" element={<Guard roles={RESEARCHER_STUDENT}><IlshanModulePage /></Guard>} />
          <Route path="/image-documentation" element={<Guard roles={RESEARCHER_STUDENT}><IlshanModulePage /></Guard>} />

          {/* Skeletal Analysis / AI Assistant (KGC) — Researcher full, Student view */}
          <Route path="/skeleton" element={<Guard roles={RESEARCHER_STUDENT}><SkeletonViewerPage /></Guard>} />
          <Route path="/ai-assistant" element={<Guard roles={RESEARCHER}><AIAssistantPage /></Guard>} />
          <Route path="/analysis" element={<Guard roles={RESEARCHER}><AIAssistantPage /></Guard>} />

          {/* Data Integration & Management (Minuri) — Admin full, Researcher shared
              (own-record edit only, enforced by RLS + the Specimen Detail page).
              Student has no access to this module at all. */}
          <Route path="/admin/approvals" element={<Guard roles={ADMIN}><AdminApprovalsPage /></Guard>} />
          <Route path="/minuri" element={<Guard roles={ADMIN_RESEARCHER}><MinuriModulePage /></Guard>} />
          <Route path="/data-management" element={<Guard roles={ADMIN_RESEARCHER}><MinuriModulePage /></Guard>} />
          <Route path="/specimens/add" element={<Guard roles={ADMIN_RESEARCHER}><SpecimenFormPage /></Guard>} />
          <Route path="/specimens/import" element={<Guard roles={ADMIN_RESEARCHER}><DataImportPage /></Guard>} />
          <Route path="/specimens" element={<Guard roles={ADMIN_RESEARCHER}><SpecimenListPage /></Guard>} />
          <Route path="/specimens/:id" element={<Guard roles={ADMIN_RESEARCHER}><SpecimenDetailPage /></Guard>} />
          <Route path="/data-quality" element={<Guard roles={ADMIN_RESEARCHER}><DataQualityPage /></Guard>} />

          {/* GIS & Spatial Analysis (Parami) — Researcher full, Student view;
              Add Site is Admin-only, not part of the Researcher/Student workflow */}
          <Route path="/parami" element={<Guard roles={RESEARCHER_STUDENT}><ParamiModulePage /></Guard>} />
          <Route path="/spatial-analysis" element={<Guard roles={RESEARCHER_STUDENT}><ParamiModulePage /></Guard>} />
          <Route path="/parami/site/:siteId" element={<Guard roles={RESEARCHER_STUDENT}><SiteDetailPage /></Guard>} />
          <Route path="/parami/add-site" element={<Guard roles={ADMIN}><AddSitePage /></Guard>} />
          <Route path="/parami/similar-findings" element={<Guard roles={RESEARCHER_STUDENT}><SimilarFindingsPage /></Guard>} />
          <Route path="/parami/add-specimen" element={<Guard roles={RESEARCHER}><AddSpecimenPage /></Guard>} />
          <Route path="/parami/home" element={<Guard roles={RESEARCHER_STUDENT}><GISHome /></Guard>} />

          {/* Skeletal Module Routes — all flat, no sidebar. Researcher full,
              Student can view dashboards/reports/knowledge base but not create
              new analyses */}
          <Route path="/skeletal" element={<Guard roles={RESEARCHER_STUDENT}><SkeletalModulePage /></Guard>} />
          <Route path="/skeletal/dashboard" element={<Guard roles={RESEARCHER_STUDENT}><SkeletalDashboard /></Guard>} />
          <Route path="/skeletal/analysis/new" element={<Guard roles={RESEARCHER}><SkeletalStep1 /></Guard>} />
          <Route path="/skeletal/analysis/step2" element={<Guard roles={RESEARCHER}><SkeletalStep2 /></Guard>} />
          <Route path="/skeletal/analysis/step3" element={<Guard roles={RESEARCHER}><SkeletalStep3 /></Guard>} />
          <Route path="/skeletal/report" element={<Guard roles={RESEARCHER_STUDENT}><SkeletalReport /></Guard>} />
          <Route path="/skeletal/report/:caseId" element={<Guard roles={RESEARCHER_STUDENT}><SkeletalReport /></Guard>} />
          <Route path="/skeletal/cases" element={<Guard roles={RESEARCHER_STUDENT}><SkeletalPastAnalysis /></Guard>} />
          <Route path="/skeletal/knowledge" element={<Guard roles={RESEARCHER_STUDENT}><SkeletalKnowledgeBase /></Guard>} />
          <Route path="/skeletal/knowledge/tutorial" element={<Guard roles={RESEARCHER_STUDENT}><SkeletalNewAnalysisTutorial /></Guard>} />
          <Route path="/skeletal/knowledge/guide" element={<Guard roles={RESEARCHER_STUDENT}><SkeletalBoneFeatureGuide /></Guard>} />
          <Route path="/skeletal/knowledge/course" element={<Guard roles={RESEARCHER_STUDENT}><SkeletalCourse /></Guard>} />
    </Routes>
  )
}

function AppContent() {
  const { pathname } = useLocation()
  const isSkeletalModule = pathname.startsWith('/skeletal')

  if (isSkeletalModule) {
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
    <AppAuthProvider>
      <AuthProvider>
        <AnalysisProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AnalysisProvider>
      </AuthProvider>
    </AppAuthProvider>
  )
}

export default App
