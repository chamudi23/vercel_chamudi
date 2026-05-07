import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import BonePage from './pages/BonePage'
import BoneDetailPage from './pages/BoneDetailPage'
import ImageSearchPage from './pages/ImageSearchPage'
import SkeletonViewerPage from './pages/SkeletonViewerPage'
import IlshanModulePage from './pages/IlshanModulePage'
import MinuriModulePage from './pages/MinuriModulePage'
import SpecimenFormPage from './pages/SpecimenFormPage'
import SiteDetailPage from "./pages/SiteDetailPage";
import ParamiModulePage from './pages/ParamiModulePage'
import ImageUploadPage from './pages/ImageUploadPage'
import AIAssistantPage from './pages/AIAssistantPage'
import SpecimenListPage from "./pages/SpecimenListPage";
import SpecimenDetailPage from "./pages/SpecimenDetailPage";
import DataImportPage from "./pages/DataImportPage";
import DataQualityPage from "./pages/DataQualityPage";

function App() {
  return (
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
            <Link to="/" className="text-slate-300 hover:text-blue-400 transition-colors">
              Home
            </Link>
            <Link to="/upload" className="text-slate-300 hover:text-blue-400 transition-colors">
              Upload
            </Link>
            <Link to="/gallery" className="text-slate-300 hover:text-blue-400 transition-colors">
              Gallery
            </Link>
            <Link to="/skeleton" className="text-slate-300 hover:text-blue-400 transition-colors">
              Skeleton
            </Link>
            <Link to="/ai-assistant" className="text-slate-300 hover:text-blue-400 transition-colors">
              AI Assistant
            </Link>
          </nav>
        </div>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<ImageUploadPage />} />
          <Route path="/gallery" element={<ImageSearchPage />} />
          <Route path="/search" element={<ImageSearchPage />} />
          <Route path="/skeleton" element={<SkeletonViewerPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/module" element={<IlshanModulePage />} />
          <Route path="/bones" element={<BonePage />} />
          <Route path="/bones/:boneId" element={<BoneDetailPage />} />
          <Route path="/minuri" element={<MinuriModulePage />} />
          <Route path="/specimens/add" element={<SpecimenFormPage />} />
          <Route path="/specimens/import" element={<DataImportPage />} />
          <Route path="/specimens" element={<SpecimenListPage />} />
          <Route path="/specimens/:id" element={<SpecimenDetailPage />} />
          <Route path="/data-quality" element={<DataQualityPage />} />
          <Route path="/parami" element={<ParamiModulePage />} />
          <Route path="/parami/site/:siteId" element={<SiteDetailPage />} />
        </Routes>

      </div>
    </BrowserRouter>
  )
}

export default App
