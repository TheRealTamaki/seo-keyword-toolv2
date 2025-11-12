import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DiscoveryFilters {
  search: string;
  intent: string;
  questionsOnly: boolean;
  questionType: string;
  minVolume: string;
  maxVolume: string;
  minDifficulty: string;
  maxDifficulty: string;
  minOpportunityScore: string;
  wordCount: string;
}

interface ResearchFiltersProps {
  filters: DiscoveryFilters;
  onFiltersChange: (filters: DiscoveryFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

const ResearchFilters: React.FC<ResearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onClear,
}) => {
  const updateFilter = (key: keyof DiscoveryFilters, value: string | boolean) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'questionsOnly') return value === true;
    return value !== '' && value !== false;
  });

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
            placeholder="Filter by keyword text..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
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

        {/* Questions Only */}
        <div className="flex items-center pt-6">
          <input
            type="checkbox"
            id="questionsOnly"
            checked={filters.questionsOnly}
            onChange={(e) => updateFilter('questionsOnly', e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="questionsOnly" className="ml-2 block text-sm text-gray-900">
            Questions Only
          </label>
        </div>

        {/* Question Type */}
        {filters.questionsOnly && (
          <div>
            <label htmlFor="questionType" className="block text-sm font-medium text-gray-700 mb-1">
              Question Type
            </label>
            <select
              id="questionType"
              value={filters.questionType}
              onChange={(e) => updateFilter('questionType', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="what">What</option>
              <option value="how">How</option>
              <option value="why">Why</option>
              <option value="when">When</option>
              <option value="where">Where</option>
              <option value="who">Who</option>
              <option value="which">Which</option>
            </select>
          </div>
        )}

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

        {/* Min Opportunity Score */}
        <div>
          <label
            htmlFor="minOpportunityScore"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Min Opportunity Score
          </label>
          <input
            type="number"
            id="minOpportunityScore"
            value={filters.minOpportunityScore}
            onChange={(e) => updateFilter('minOpportunityScore', e.target.value)}
            placeholder="e.g., 50"
            min="0"
            max="100"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* Word Count */}
        <div>
          <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 mb-1">
            Word Count
          </label>
          <input
            type="number"
            id="wordCount"
            value={filters.wordCount}
            onChange={(e) => updateFilter('wordCount', e.target.value)}
            placeholder="e.g., 2"
            min="1"
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

export default ResearchFilters;
