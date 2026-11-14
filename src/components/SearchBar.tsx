import React from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';
import { FilterState } from '../types';
import { DEPARTMENT_LIST, QUALIFICATION_LIST } from '../data/categories';

interface SearchBarProps {
  filters: FilterState;
  onChangeFilters: (filters: FilterState) => void;
  onReset: () => void;
  totalFiltered: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  onChangeFilters,
  onReset,
  totalFiltered
}) => {
  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.department !== DEPARTMENT_LIST[0] ||
    filters.qualification !== QUALIFICATION_LIST[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 sm:p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* Search input field */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChangeFilters({ ...filters, searchQuery: e.target.value })}
            placeholder="नौकरी का नाम, पद, योजना या विभाग खोजें (उदा. पुलिस, पटवारी, MPPSC)..."
            className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChangeFilters({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Department select */}
        <div className="md:col-span-3">
          <select
            value={filters.department}
            onChange={(e) => onChangeFilters({ ...filters, department: e.target.value })}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
          >
            {DEPARTMENT_LIST.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Qualification select */}
        <div className="md:col-span-3">
          <select
            value={filters.qualification}
            onChange={(e) => onChangeFilters({ ...filters, qualification: e.target.value })}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
          >
            {QUALIFICATION_LIST.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        {/* Action: Reset & counter */}
        <div className="md:col-span-1 flex items-center justify-between md:justify-end gap-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-2 rounded-lg border border-rose-200 transition font-medium whitespace-nowrap cursor-pointer"
              title="फ़िल्टर हटाएं"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>रीसेट</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter status strip if search/filters active */}
      {hasActiveFilters && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            फ़िल्टर परिणाम: <strong className="text-slate-900">{totalFiltered}</strong> सूचनाएँ मिलीं
          </span>
          <span className="text-slate-400 text-[11px]">
            खोज शब्द: "{filters.searchQuery || 'सभी'}"
          </span>
        </div>
      )}
    </div>
  );
};
