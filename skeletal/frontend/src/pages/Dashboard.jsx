import { Users, Activity, Target, UserCheck } from 'lucide-react';
import StatCard from '../components/data/StatCard';
import AgeDistributionChart from '../components/charts/AgeDistributionChart';
import GenderDistributionChart from '../components/charts/GenderDistributionChart';
import DataTable from '../components/data/DataTable';

const mockAgeData = [
  { ageGroup: '0-18', count: 18 },
  { ageGroup: '19-30', count: 68 },
  { ageGroup: '31-40', count: 48 },
  { ageGroup: '41-50', count: 30 },
  { ageGroup: '51+', count: 22 },
];

const mockGenderData = [
  { name: 'Male', value: 60 },
  { name: 'Female', value: 40 },
];

const mockTableColumns = [
  { key: 'caseId', label: 'Case ID' },
  { key: 'name', label: 'Name' },
  { key: 'bonesType', label: 'Bones Type' },
  { key: 'location', label: 'Location' },
  { key: 'foundDate', label: 'Found Date' },
];

const mockTableData = [
  { caseId: 'C001', name: 'A N Perera', bonesType: '(225) 555-0118', location: 'jane@microsoft.com', foundDate: 'United States' },
  { caseId: 'C002', name: 'Yahoo', bonesType: '(205) 555-0100', location: 'floyd@yahoo.com', foundDate: 'Kiribati' },
  { caseId: 'C003', name: 'Adobe', bonesType: '(302) 555-0107', location: 'ronald@adobe.com', foundDate: 'Israel' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Top Row: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Cases"
          value="158"
          subtitle="All Time Cases"
          icon={Users}
        />
        <StatCard
          title="Recent Analysis"
          value="89"
          subtitle="this month"
          icon={Activity}
          subtitleColor="text-gray-400"
        />
        <StatCard
          title="Average Accuracy"
          value="98.8%"
          subtitle=""
          icon={Target}
        />
        <StatCard
          title="Last Prediction"
          value="Female"
          subtitle="2 hours ago"
          icon={UserCheck}
        />
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AgeDistributionChart data={mockAgeData} />
        </div>
        <div className="lg:col-span-1">
          <GenderDistributionChart data={mockGenderData} />
        </div>
      </div>

      {/* Bottom Row: Data Table */}
      <DataTable title="Recent Cases" columns={mockTableColumns} data={mockTableData} />
    </div>
  );
}
