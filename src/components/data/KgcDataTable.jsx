import { Search, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DataTable({ title = "Recent Cases", columns, data, hasSearch = true }) {
  return (
    <div className="bg-dark-card rounded-2xl border border-dark-border/50 overflow-hidden shadow-sm">
      <div className="p-6 flex items-center justify-between border-b border-dark-border/50">
        <h2 className="text-white text-lg font-semibold">{title}</h2>
        
        {hasSearch && (
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search"
                className="bg-white text-gray-900 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue w-64"
              />
            </div>
            <select className="bg-white text-gray-900 rounded-lg px-3 py-2 text-sm border-r-8 border-transparent focus:outline-none">
              <option>Short by : Newest</option>
              <option>Oldest</option>
            </select>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-dark-border/50 text-text-secondary text-sm font-medium">
              {columns.map((col) => (
                <th key={col.key} className="p-4 py-5 font-normal">
                  {col.label}
                </th>
              ))}
              <th className="p-4 py-5 font-normal text-center w-24">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-text-primary">
            {data.map((row, i) => (
              <tr key={i} className="border-b border-dark-border/50 hover:bg-dark-border/20 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="p-4 py-5">
                    {row[col.key]}
                  </td>
                ))}
                <td className="p-4 py-5">
                  <div className="flex items-center justify-center gap-3">
                    <Link to={`/skeletal/dashboard/analysis/report`} className="text-brand-blue hover:text-blue-400 transition-colors">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button className="text-brand-red hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 flex items-center justify-between text-xs text-text-secondary">
        <div>Showing data 1 to 8 of 256K entries</div>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-dark-border transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded bg-brand-blue text-white font-medium">1</button>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-dark-border transition-colors">2</button>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-dark-border transition-colors">3</button>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-dark-border transition-colors">4</button>
          <span className="px-1">...</span>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-dark-border transition-colors">40</button>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-dark-border transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
