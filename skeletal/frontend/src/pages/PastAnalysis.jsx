import DataTable from '../components/data/DataTable';

export default function PastAnalysis() {
  const mockTableColumns = [
    { key: 'caseId', label: 'Case ID' },
    { key: 'name', label: 'Name' },
    { key: 'bonesType', label: 'Bones Type' },
    { key: 'location', label: 'Location' },
    { key: 'foundDate', label: 'Found Date' },
  ];

  // Generating a bit more data for the full page view
  const mockTableData = Array.from({ length: 15 }, (_, i) => ({
    caseId: `C0${(i + 1).toString().padStart(2, '0')}`,
    name: ['A N Perera', 'Yahoo', 'Adobe', 'John Doe', 'Jane Smith'][i % 5],
    bonesType: ['Skull', 'Pelvis', 'Femur', 'Ribs', 'Mandible'][i % 5],
    location: ['United States', 'Kiribati', 'Israel', 'Canada', 'UK'][i % 5],
    foundDate: `2026-02-${(i + 1).toString().padStart(2, '0')}`,
  }));

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Past Analysis</h1>
        <p className="text-text-secondary mt-2">Searchable repository of all historical case data.</p>
      </div>
      <DataTable title="All Cases" columns={mockTableColumns} data={mockTableData} />
    </div>
  );
}
