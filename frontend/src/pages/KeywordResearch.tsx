import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { keywordResearchService } from '../services/api';
import ResearchFilters from '../components/KeywordResearch/ResearchFilters';
import SaveToListModal from '../components/KeywordResearch/SaveToListModal';
import AddToTrackingModal from '../components/KeywordResearch/AddToTrackingModal';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BookmarkIcon,
  PlusCircleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

interface ResearchKeyword {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
  isQuestion?: boolean;
  questionType?: string;
  opportunityScore?: number;
  wordCount?: number;
}

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

const KeywordResearch: React.FC = () => {
  const [discoveryMode, setDiscoveryMode] = useState<'seeds' | 'domain' | 'autocomplete' | 'related'>('seeds');
  const [loading, setLoading] = useState(false);

  // Discovery inputs
  const [seedKeywords, setSeedKeywords] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [singleKeyword, setSingleKeyword] = useState('');
  const [location, setLocation] = useState('United States');
  const [language, setLanguage] = useState('en');

  // Results
  const [keywords, setKeywords] = useState<ResearchKeyword[]>([]);
  const [filteredKeywords, setFilteredKeywords] = useState<ResearchKeyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAddToTrackingModal, setShowAddToTrackingModal] = useState(false);
  const [sortField, setSortField] = useState<string>('opportunityScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filters
  const [filters, setFilters] = useState<DiscoveryFilters>({
    search: '',
    intent: '',
    questionsOnly: false,
    questionType: '',
    minVolume: '',
    maxVolume: '',
    minDifficulty: '',
    maxDifficulty: '',
    minOpportunityScore: '',
    wordCount: '',
  });

  const handleDiscover = async () => {
    let discoveryData: any = {
      location,
      language,
    };

    if (discoveryMode === 'seeds') {
      const seeds = seedKeywords
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (seeds.length === 0) {
        toast.error('Please enter at least one seed keyword');
        return;
      }

      discoveryData.seeds = seeds;
      discoveryData.includeAutocomplete = true;
      discoveryData.includeRelated = true;
    } else if (discoveryMode === 'domain') {
      if (!domainInput.trim()) {
        toast.error('Please enter a domain');
        return;
      }
      discoveryData.domain = domainInput.trim();
    } else if (discoveryMode === 'autocomplete' || discoveryMode === 'related') {
      if (!singleKeyword.trim()) {
        toast.error('Please enter a keyword');
        return;
      }
    }

    try {
      setLoading(true);
      let response;

      if (discoveryMode === 'seeds' || discoveryMode === 'domain') {
        response = await keywordResearchService.discover(discoveryData);
      } else if (discoveryMode === 'autocomplete') {
        response = await keywordResearchService.autocomplete({
          keyword: singleKeyword.trim(),
          location,
          language,
        });
      } else {
        response = await keywordResearchService.related({
          keyword: singleKeyword.trim(),
          location,
          language,
        });
      }

      if (response.data.success) {
        const discoveredKeywords = response.data.data || [];
        setKeywords(discoveredKeywords);
        setFilteredKeywords(discoveredKeywords);
        setSelectedKeywords(new Set());
        toast.success(`Discovered ${discoveredKeywords.length} keywords!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to discover keywords');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    let filtered = [...keywords];

    // Text search
    if (filters.search) {
      filtered = filtered.filter((k) =>
        k.keyword.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Intent filter
    if (filters.intent) {
      filtered = filtered.filter((k) => k.intent === filters.intent);
    }

    // Questions only
    if (filters.questionsOnly) {
      filtered = filtered.filter((k) => k.isQuestion);
    }

    // Question type
    if (filters.questionType) {
      filtered = filtered.filter((k) => k.questionType === filters.questionType);
    }

    // Volume range
    if (filters.minVolume) {
      filtered = filtered.filter((k) => (k.searchVolume || 0) >= parseInt(filters.minVolume));
    }
    if (filters.maxVolume) {
      filtered = filtered.filter((k) => (k.searchVolume || 0) <= parseInt(filters.maxVolume));
    }

    // Difficulty range
    if (filters.minDifficulty) {
      filtered = filtered.filter((k) => (k.difficulty || 0) >= parseInt(filters.minDifficulty));
    }
    if (filters.maxDifficulty) {
      filtered = filtered.filter((k) => (k.difficulty || 0) <= parseInt(filters.maxDifficulty));
    }

    // Opportunity score
    if (filters.minOpportunityScore) {
      filtered = filtered.filter(
        (k) => (k.opportunityScore || 0) >= parseInt(filters.minOpportunityScore)
      );
    }

    // Word count
    if (filters.wordCount) {
      const targetCount = parseInt(filters.wordCount);
      filtered = filtered.filter((k) => k.wordCount === targetCount);
    }

    setFilteredKeywords(filtered);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      intent: '',
      questionsOnly: false,
      questionType: '',
      minVolume: '',
      maxVolume: '',
      minDifficulty: '',
      maxDifficulty: '',
      minOpportunityScore: '',
      wordCount: '',
    });
    setFilteredKeywords(keywords);
    setShowFilters(false);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }

    const sorted = [...filteredKeywords].sort((a: any, b: any) => {
      const aVal = a[field] || 0;
      const bVal = b[field] || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    setFilteredKeywords(sorted);
  };

  const toggleKeywordSelection = (keyword: string) => {
    const newSet = new Set(selectedKeywords);
    if (newSet.has(keyword)) {
      newSet.delete(keyword);
    } else {
      newSet.add(keyword);
    }
    setSelectedKeywords(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedKeywords.size === filteredKeywords.length) {
      setSelectedKeywords(new Set());
    } else {
      setSelectedKeywords(new Set(filteredKeywords.map((k) => k.keyword)));
    }
  };

  const getIntentBadgeColor = (intent?: string) => {
    switch (intent?.toLowerCase()) {
      case 'informational':
        return 'bg-blue-100 text-blue-800';
      case 'commercial':
        return 'bg-yellow-100 text-yellow-800';
      case 'transactional':
        return 'bg-green-100 text-green-800';
      case 'navigational':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOpportunityColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 70) return 'text-green-600 font-semibold';
    if (score >= 40) return 'text-yellow-600 font-medium';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return 'text-gray-500';
    if (difficulty < 30) return 'text-green-600';
    if (difficulty < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSelectedKeywordsData = () => {
    return filteredKeywords.filter((k) => selectedKeywords.has(k.keyword));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Keyword Research</h1>
          <p className="mt-2 text-sm text-gray-600">
            Discover high-opportunity keywords through multiple research methods
          </p>
        </div>

        {/* Discovery Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Mode Selection */}
          <div className="flex items-center space-x-2 mb-6">
            <button
              onClick={() => setDiscoveryMode('seeds')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                discoveryMode === 'seeds'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <SparklesIcon className="h-4 w-4 inline mr-2" />
              Seed Expansion
            </button>
            <button
              onClick={() => setDiscoveryMode('domain')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                discoveryMode === 'domain'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Domain Keywords
            </button>
            <button
              onClick={() => setDiscoveryMode('autocomplete')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                discoveryMode === 'autocomplete'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Autocomplete
            </button>
            <button
              onClick={() => setDiscoveryMode('related')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                discoveryMode === 'related'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Related Keywords
            </button>
          </div>

          {/* Discovery Inputs */}
          <div className="space-y-4">
            {discoveryMode === 'seeds' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seed Keywords (one per line)
                </label>
                <textarea
                  value={seedKeywords}
                  onChange={(e) => setSeedKeywords(e.target.value)}
                  placeholder="Enter seed keywords, one per line&#10;e.g.,&#10;running shoes&#10;athletic footwear&#10;sports sneakers"
                  rows={6}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  We'll find related keywords, autocomplete suggestions, and variations
                </p>
              </div>
            )}

            {discoveryMode === 'domain' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competitor Domain
                </label>
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="e.g., example.com"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Discover keywords a competitor domain ranks for
                </p>
              </div>
            )}

            {(discoveryMode === 'autocomplete' || discoveryMode === 'related') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {discoveryMode === 'autocomplete'
                    ? 'Keyword for Autocomplete'
                    : 'Keyword for Related Suggestions'}
                </label>
                <input
                  type="text"
                  value={singleKeyword}
                  onChange={(e) => setSingleKeyword(e.target.value)}
                  placeholder="e.g., running shoes"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Location and Language */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., United States"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
            </div>

            {/* Discover Button */}
            <button
              onClick={handleDiscover}
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Discovering Keywords...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Discover Keywords
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {keywords.length > 0 && (
          <>
            {/* Actions Bar */}
            <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {filteredKeywords.length} keywords
                  {selectedKeywords.size > 0 && ` (${selectedKeywords.size} selected)`}
                </span>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    showFilters
                      ? 'border-primary-600 text-primary-700 bg-primary-50'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <FunnelIcon className="h-4 w-4 mr-1.5" />
                  Filters
                </button>
              </div>

              {selectedKeywords.size > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <BookmarkIcon className="h-4 w-4 mr-1.5" />
                    Save to List
                  </button>
                  <button
                    onClick={() => setShowAddToTrackingModal(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-1.5" />
                    Add to Tracking
                  </button>
                </div>
              )}
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <ResearchFilters
                filters={filters}
                onFiltersChange={setFilters}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />
            )}

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedKeywords.size === filteredKeywords.length}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </th>
                      <th
                        onClick={() => handleSort('keyword')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Keyword</span>
                          {sortField === 'keyword' &&
                            (sortDirection === 'asc' ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('opportunityScore')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <LightBulbIcon className="h-4 w-4" />
                          <span>Opportunity</span>
                          {sortField === 'opportunityScore' &&
                            (sortDirection === 'asc' ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('searchVolume')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Volume</span>
                          {sortField === 'searchVolume' &&
                            (sortDirection === 'asc' ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('difficulty')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Difficulty</span>
                          {sortField === 'difficulty' &&
                            (sortDirection === 'asc' ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CPC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Intent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredKeywords.map((keyword) => (
                      <tr
                        key={keyword.keyword}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleKeywordSelection(keyword.keyword)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedKeywords.has(keyword.keyword)}
                            onChange={() => toggleKeywordSelection(keyword.keyword)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {keyword.keyword}
                            </div>
                            {keyword.isQuestion && (
                              <div className="text-xs text-blue-600 mt-1">
                                Question ({keyword.questionType})
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${getOpportunityColor(keyword.opportunityScore)}`}>
                            {keyword.opportunityScore || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {keyword.searchVolume?.toLocaleString() || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                            {keyword.difficulty || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {keyword.cpc ? `$${keyword.cpc.toFixed(2)}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {keyword.intent && (
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getIntentBadgeColor(
                                keyword.intent
                              )}`}
                            >
                              {keyword.intent}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-500">
                            {keyword.wordCount} word{keyword.wordCount !== 1 ? 's' : ''}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Keywords</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {filteredKeywords.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Avg. Volume</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {Math.round(
                      filteredKeywords.reduce((sum, k) => sum + (k.searchVolume || 0), 0) /
                        filteredKeywords.filter((k) => k.searchVolume).length || 0
                    ).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Avg. Difficulty</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {Math.round(
                      filteredKeywords.reduce((sum, k) => sum + (k.difficulty || 0), 0) /
                        filteredKeywords.filter((k) => k.difficulty).length || 0
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Avg. Opportunity</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {Math.round(
                      filteredKeywords.reduce((sum, k) => sum + (k.opportunityScore || 0), 0) /
                        filteredKeywords.filter((k) => k.opportunityScore).length || 0
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Questions</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {filteredKeywords.filter((k) => k.isQuestion).length}
                  </dd>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showSaveModal && (
        <SaveToListModal
          keywords={getSelectedKeywordsData()}
          onClose={() => setShowSaveModal(false)}
          onSuccess={() => {
            setShowSaveModal(false);
            setSelectedKeywords(new Set());
            toast.success('Keywords saved to list successfully!');
          }}
        />
      )}

      {showAddToTrackingModal && (
        <AddToTrackingModal
          keywords={getSelectedKeywordsData()}
          onClose={() => setShowAddToTrackingModal(false)}
          onSuccess={() => {
            setShowAddToTrackingModal(false);
            setSelectedKeywords(new Set());
            toast.success('Keywords added to tracking successfully!');
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default KeywordResearch;
