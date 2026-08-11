import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import BonePage from './pages/BonePage'
import HomePage from './pages/HomePage'
import BoneDetailPage from './pages/BoneDetailPage'
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

function App() {
  return (
    <AuthProvider>
    <AnalysisProvider>
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100">

        <div className="bg-slate-800 border-b border-slate-700 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">OAHRIS</h1>
            <p className="text-slate-400 text-xs">
              Osteoarchaeological Research Information System
            </p>
          </div>
          <nav className="flex gap-6">
            <Link to="/"
              className="text-slate-300 hover:text-blue-400 transition-colors">
              Home
            </Link>
            <Link to="/bones"
              className="text-slate-300 hover:text-blue-400 transition-colors">
              Bone Records
            </Link>
            <Link to="/search"
              className="text-slate-300 hover:text-blue-400 transition-colors">
              Image Search
            </Link>
            <Link to="/skeleton"
              className="text-slate-300 hover:text-blue-400 transition-colors">
              Skeleton Viewer
            </Link>
          </nav>
        </div>

        <Routes>
          {/* Main OAHRIS Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/bones" element={<BonePage />} />
          <Route path="/bones/:boneId" element={<BoneDetailPage />} />
          <Route path="/upload" element={<ImageUploadPage />} />
          <Route path="/gallery" element={<ImageSearchPage />} />
          <Route path="/image/:imageId" element={<ImageDetailPage />} />
          <Route path="/search" element={<ImageSearchPage />} />
          <Route path="/skeleton" element={<SkeletonViewerPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/analysis" element={<AIAssistantPage />} />
          <Route path="/module" element={<IlshanModulePage />} />
          <Route path="/image-documentation" element={<IlshanModulePage />} />
          <Route path="/minuri" element={<MinuriModulePage />} />
          <Route path="/specimens/add" element={<SpecimenFormPage />} />
          <Route path="/specimens/import" element={<DataImportPage />} />
          <Route path="/specimens" element={<SpecimenListPage />} />
          <Route path="/specimens/:id" element={<SpecimenDetailPage />} />
          <Route path="/data-quality" element={<DataQualityPage />} />
          <Route path="/parami" element={<ParamiModulePage />} />
          <Route path="/parami/site/:siteId" element={<SiteDetailPage />} />
          <Route path="/parami/add-site" element={<AddSitePage />} />
          <Route path="/parami/similar-findings" element={<SimilarFindingsPage />} />
          <Route path="/parami/add-specimen" element={<AddSpecimenPage />} />

          {/* Skeletal Module Routes — all flat, no sidebar */}
          <Route path="/skeletal" element={<SkeletalModulePage />} />
          <Route path="/skeletal/dashboard" element={<SkeletalDashboard />} />
          <Route path="/skeletal/analysis/new" element={<SkeletalStep1 />} />
          <Route path="/skeletal/analysis/step2" element={<SkeletalStep2 />} />
          <Route path="/skeletal/analysis/step3" element={<SkeletalStep3 />} />
          <Route path="/skeletal/report" element={<SkeletalReport />} />
          <Route path="/skeletal/report/:caseId" element={<SkeletalReport />} />
          <Route path="/skeletal/cases" element={<SkeletalPastAnalysis />} />
          <Route path="/skeletal/knowledge" element={<SkeletalKnowledgeBase />} />
          <Route path="/skeletal/knowledge/tutorial" element={<SkeletalNewAnalysisTutorial />} />
          <Route path="/skeletal/knowledge/guide" element={<SkeletalBoneFeatureGuide />} />
          <Route path="/skeletal/knowledge/course" element={<SkeletalCourse />} />
        </Routes>

      </div>
    </BrowserRouter>
    </AnalysisProvider>
    </AuthProvider>
  )
}

export default App
