import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SkeletalHeader from '../components/KgcSkeletalHeader';

const allData = Array.from({ length: 15 }, (_, i) => ({
  caseId: `C0${(i + 1).toString().padStart(2, '0')}`,
  name: ['A N Perera', 'K Silva', 'R Fernando', 'D Jayawardena', 'S Bandara'][i % 5],
  bonesType: ['Skull', 'Pelvis', 'Femur', 'Ribs', 'Mandible'][i % 5],
  location: ['Kottawa', 'Anuradhapura', 'Polonnaruwa', 'Kandy', 'Galle'][i % 5],
  foundDate: `2026-02-${(i + 1).toString().padStart(2, '0')}`,
}));

const columns = [
  { key: 'caseId', label: 'Case ID' },
  { key: 'name', label: 'Name' },
  { key: 'bonesType', label: 'Bones Type' },
  { key: 'location', label: 'Location' },
  { key: 'foundDate', label: 'Found Date' },
];

// Extract unique values for filters
const boneTypes = [...new Set(allData.map(d => d.bonesType))];
const locations = [...new Set(allData.map(d => d.location))];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

export default function PastAnalysis() {
  const [search, setSearch] = useState('');
  const [boneFilter, setBoneFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filtered = useMemo(() => {
    let result = allData;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(val => val.toLowerCase().includes(q))
      );
    }

    // Bone type filter
    if (boneFilter) {
      result = result.filter(row => row.bonesType === boneFilter);
    }

    // Location filter
    if (locationFilter) {
      result = result.filter(row => row.location === locationFilter);
    }

    // Sort
    if (sortBy === 'oldest') {
      result = [...result].sort((a, b) => a.foundDate.localeCompare(b.foundDate));
    } else {
      result = [...result].sort((a, b) => b.foundDate.localeCompare(a.foundDate));
    }

    return result;
  }, [search, boneFilter, locationFilter, sortBy]);

  const activeFilterCount = [boneFilter, locationFilter].filter(Boolean).length;

  const clearFilters = () => {
    setBoneFilter('');
    setLocationFilter('');
    setSearch('');
    setSortBy('newest');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <SkeletalHeader
        title="Past Analysis"
        subtitle="Searchable repository of all historical case data"
      />

      <div className="px-6 pb-12 space-y-4">
        {/* Search + Filters Bar */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search by Case ID, Name, Location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Bones Type Filter */}
            <select
              value={boneFilter}
              onChange={(e) => setBoneFilter(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors appearance-none min-w-[140px]"
            >
              <option value="">All Bone Types</option>
              {boneTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors appearance-none min-w-[140px]"
            >
              <option value="">All Locations</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors appearance-none min-w-[120px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            {/* Clear filters */}
            {(search || activeFilterCount > 0) && (
              <button
                onClick={clearFilters}
                className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                Clear
              </button>
            )}
          </div>

          {/* Active filter tags */}
          {(boneFilter || locationFilter) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700">
              <span className="text-slate-500 text-xs">Active filters:</span>
              {boneFilter && (
                <span className="bg-orange-900/30 text-orange-300 text-xs px-2 py-1 rounded-full border border-orange-700/30 flex items-center gap-1">
                  Bone: {boneFilter}
                  <button onClick={() => setBoneFilter('')} className="hover:text-white">×</button>
                </span>
              )}
              {locationFilter && (
                <span className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-700/30 flex items-center gap-1">
                  Location: {locationFilter}
                  <button onClick={() => setLocationFilter('')} className="hover:text-white">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-slate-200 font-semibold">All Cases</h3>
            <span className="text-slate-500 text-sm">
              {filtered.length} of {allData.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {columns.map((col) => (
                    <th key={col.key} className="text-left px-6 py-3 text-slate-400 font-medium">{col.label}</th>
                  ))}
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                      <div className="text-slate-500">
                        <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                        <p className="font-medium">No cases found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((row, i) => (
                  <tr key={i} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-3 text-slate-300">
                        {col.key === 'foundDate' ? formatDate(row[col.key]) : row[col.key]}
                      </td>
                    ))}
                    <td className="px-6 py-3">
                      <Link to="/skeletal/report" className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
