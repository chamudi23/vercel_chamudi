import { Download, Mail } from 'lucide-react';
import Button from '../components/common/Button';
import DataTable from '../components/data/DataTable';
import AgeDistributionChart from '../components/charts/AgeDistributionChart';

export default function Report() {
  const mockSimilarCasesCols = [
    { key: 'caseId', label: 'Case ID' },
    { key: 'name', label: 'Name' },
    { key: 'bonesType', label: 'Bones Type' },
    { key: 'location', label: 'Location' },
    { key: 'foundDate', label: 'Found Date' },
  ];

  const mockSimilarCasesData = [
    { caseId: 'C089', name: 'Unknown', bonesType: 'Skull', location: 'Texas', foundDate: '2023-01-15' },
    { caseId: 'C102', name: 'Unknown', bonesType: 'Skull', location: 'Nevada', foundDate: '2023-04-22' },
  ];

  const mockAgeData = [
    { ageGroup: '0-18', count: 5 },
    { ageGroup: '19-30', count: 45 },
    { ageGroup: '31-40', count: 20 },
    { ageGroup: '41-50', count: 10 },
    { ageGroup: '51+', count: 2 },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-white text-2xl font-semibold">Prediction Report #0001</h2>
        <div className="flex gap-4">
          <Button variant="success" className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> Send Mail
          </Button>
          <Button variant="primary" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-card border border-dark-border/50 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-white font-semibold text-lg border-b border-dark-border/50 pb-2 mb-4">Basic Information & Features</h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="text-text-secondary">Case ID:</div><div className="text-white font-medium">#0001</div>
            <div className="text-text-secondary">Investigator:</div><div className="text-white font-medium">Chamudi Gayeshika</div>
            <div className="text-text-secondary">Location:</div><div className="text-white font-medium">Kottawa</div>
            <div className="text-text-secondary">Date Found:</div><div className="text-white font-medium">2026-02-24</div>
            <div className="text-text-secondary">Brow Ridge:</div><div className="text-white font-medium">Prominent</div>
            <div className="text-text-secondary">Jaw Shape:</div><div className="text-white font-medium">Square</div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-white font-semibold text-lg border-b border-dark-border/50 pb-2 mb-4">Prediction Result</h3>
          <div className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Gender</span>
              <span className="text-white text-xl font-bold">Female</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Age Range</span>
              <span className="text-white text-xl font-bold">25 - 35</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Height</span>
              <span className="text-white text-xl font-bold">165 cm</span>
            </div>
            <div className="mt-8 p-4 bg-brand-green/10 rounded-lg border border-brand-green/20">
              <div className="flex justify-between items-center">
                <span className="text-brand-green font-medium">Confidence Level</span>
                <span className="text-brand-green text-2xl font-bold">94.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div>
          <DataTable title="Similar Cases" columns={mockSimilarCasesCols} data={mockSimilarCasesData} hasSearch={false} />
        </div>
        <div>
          <AgeDistributionChart data={mockAgeData} />
        </div>
      </div>
    </div>
  );
}
