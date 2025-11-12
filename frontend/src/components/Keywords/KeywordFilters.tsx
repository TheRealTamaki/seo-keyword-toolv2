import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Filters {
  search: string;
  searchEngine: string;
  device: string;
  intent: string;
  minVolume: string;
  maxVolume: string;
  minDifficulty: string;
  maxDifficulty: string;
}

interface KeywordFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onApply: () => void;
  onClear: () => void;
}

const KeywordFilters: React.FC<KeywordFiltersProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onClear,
}) => {
  const updateFilter = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Keyword
          </label>
          <input
            type="text"
            id="search"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search by keyword..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* Search Engine */}
        <div>
          <label htmlFor="searchEngine" className="block text-sm font-medium text-gray-700 mb-1">
            Search Engine
          </label>
          <select
            id="searchEngine"
            value={filters.searchEngine}
            onChange={(e) => updateFilter('searchEngine', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="">All</option>
            <option value="google">Google</option>
            <option value="bing">Bing</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>

        {/* Device */}
        <div>
          <label htmlFor="device" className="block text-sm font-medium text-gray-700 mb-1">
            Device
          </label>
          <select
            id="device"
            value={filters.device}
            onChange={(e) => updateFilter('device', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="">All</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>

        {/* Intent */}
        <div>
          <label htmlFor="intent" className="block text-sm font-medium text-gray-700 mb-1">
            Search Intent
          </label>
          <select
            id="intent"
            value={filters.intent}
            onChange={(e) => updateFilter('intent', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="">All</option>
            <option value="informational">Informational</option>
            <option value="commercial">Commercial</option>
            <option value="transactional">Transactional</option>
            <option value="navigational">Navigational</option>
          </select>
        </div>

        {/* Min Volume */}
        <div>
          <label htmlFor="minVolume" className="block text-sm font-medium text-gray-700 mb-1">
            Min Search Volume
          </label>
          <input
            type="number"
            id="minVolume"
            value={filters.minVolume}
            onChange={(e) => updateFilter('minVolume', e.target.value)}
            placeholder="e.g., 100"
            min="0"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* Max Volume */}
        <div>
          <label htmlFor="maxVolume" className="block text-sm font-medium text-gray-700 mb-1">
            Max Search Volume
          </label>
          <input
            type="number"
            id="maxVolume"
            value={filters.maxVolume}
            onChange={(e) => updateFilter('maxVolume', e.target.value)}
            placeholder="e.g., 10000"
            min="0"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* Min Difficulty */}
        <div>
          <label htmlFor="minDifficulty" className="block text-sm font-medium text-gray-700 mb-1">
            Min Difficulty
          </label>
          <input
            type="number"
            id="minDifficulty"
            value={filters.minDifficulty}
            onChange={(e) => updateFilter('minDifficulty', e.target.value)}
            placeholder="0"
            min="0"
            max="100"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* Max Difficulty */}
        <div>
          <label htmlFor="maxDifficulty" className="block text-sm font-medium text-gray-700 mb-1">
            Max Difficulty
          </label>
          <input
            type="number"
            id="maxDifficulty"
            value={filters.maxDifficulty}
            onChange={(e) => updateFilter('maxDifficulty', e.target.value)}
            placeholder="100"
            min="0"
            max="100"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-end space-x-3">
        <button
          onClick={onClear}
          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Clear
        </button>
        <button
          onClick={onApply}
          className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default KeywordFilters;
