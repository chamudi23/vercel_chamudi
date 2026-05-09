import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LayoutWrapper from './components/layout/LayoutWrapper';
import Dashboard from './pages/Dashboard';
import Step1BasicInfo from './pages/NewAnalysis/Step1BasicInfo';
import Step2Measurements from './pages/NewAnalysis/Step2Measurements';
import Step3Review from './pages/NewAnalysis/Step3Review';
import Report from './pages/Report';
import PastAnalysis from './pages/PastAnalysis';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LayoutWrapper />}>
          <Route index element={<Dashboard />} />
          <Route path="analysis/new" element={<Step1BasicInfo />} />
          <Route path="analysis/new/step2" element={<Step2Measurements />} />
          <Route path="analysis/new/step3" element={<Step3Review />} />
          <Route path="analysis/report" element={<Report />} />
          <Route path="cases" element={<PastAnalysis />} />
          <Route path="knowledge" element={<div className="text-white">Knowledge Base (Coming Soon)</div>} />
          <Route path="settings" element={<div className="text-white">Settings (Coming Soon)</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
