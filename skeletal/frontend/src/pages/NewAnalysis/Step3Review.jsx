import { useNavigate } from 'react-router-dom';
import Stepper from '../../components/common/Stepper';
import Button from '../../components/common/Button';
import DataTable from '../../components/data/DataTable';

export default function Step3Review() {
  const navigate = useNavigate();

  const steps = [
    { label: 'Basic Information' },
    { label: 'Skeletal Measurements' },
    { label: 'Review & Predict' }
  ];

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

  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      <Stepper steps={steps} currentStep={3} />

      <div className="mt-8 space-y-6">
        <h2 className="text-white text-xl font-semibold">Prediction Results</h2>
        
        {/* Highlight Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-card border border-dark-border/50 p-6 rounded-xl flex flex-col items-center justify-center">
            <span className="text-text-secondary text-sm mb-2">Gender</span>
            <span className="text-white text-2xl font-bold">Female</span>
          </div>
          <div className="bg-dark-card border border-dark-border/50 p-6 rounded-xl flex flex-col items-center justify-center">
            <span className="text-text-secondary text-sm mb-2">Age Range</span>
            <span className="text-white text-2xl font-bold">25 - 35</span>
          </div>
          <div className="bg-dark-card border border-dark-border/50 p-6 rounded-xl flex flex-col items-center justify-center">
            <span className="text-text-secondary text-sm mb-2">Height</span>
            <span className="text-white text-2xl font-bold">165 cm</span>
          </div>
          <div className="bg-dark-card border border-dark-border/50 p-6 rounded-xl flex flex-col items-center justify-center">
            <span className="text-text-secondary text-sm mb-2">Confidence Level</span>
            <span className="text-brand-green text-2xl font-bold">94.5%</span>
          </div>
        </div>

        {/* Similar Cases */}
        <div className="mt-8">
          <DataTable title="Similar Cases" columns={mockSimilarCasesCols} data={mockSimilarCasesData} hasSearch={false} />
        </div>

        <div className="flex justify-between pt-6">
          <Button type="button" variant="success" onClick={() => navigate('/')}>Back To Dashboard</Button>
          <Button type="button" variant="primary" onClick={() => navigate('/analysis/report')}>Generate Report</Button>
        </div>
      </div>
    </div>
  );
}
