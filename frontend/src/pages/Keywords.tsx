import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { keywordsService, projectsService } from '../services/api';
import AddKeywordModal from '../components/Keywords/AddKeywordModal';
import EditKeywordModal from '../components/Keywords/EditKeywordModal';
import KeywordFilters from '../components/Keywords/KeywordFilters';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  PencilIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  domain: string;
}

interface Keyword {
  id: string;
  projectId: string;
  keyword: string;
  searchEngine: string;
  device: string;
  location: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
  createdAt: string;
  latestRanking?: {
    position: number;
    url: string;
    checkedAt: string;
  };
}

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

const Keywords: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);

  // Filters and sorting
  const [filters, setFilters] = useState<Filters>({
    search: '',
    searchEngine: '',
    device: '',
    intent: '',
    minVolume: '',
    maxVolume: '',
    minDifficulty: '',
    maxDifficulty: '',
  });
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchKeywords();
    }
  }, [selectedProject, sortField, sortDirection]);

  const fetchProjects = async () => {
    try {
      const response = await projectsService.getAll();
      const projectList = response.data.data || [];
      setProjects(projectList);
      if (projectList.length > 0 && !selectedProject) {
        setSelectedProject(projectList[0].id);
      }
    } catch (error: any) {
      toast.error('Failed to load projects');
    }
  };

  const fetchKeywords = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      const params: any = {
        sort: sortField,
        order: sortDirection,
      };

      // Add filters to params
      if (filters.search) params.search = filters.search;
      if (filters.searchEngine) params.searchEngine = filters.searchEngine;
      if (filters.device) params.device = filters.device;
      if (filters.intent) params.intent = filters.intent;
      if (filters.minVolume) params.minVolume = filters.minVolume;
      if (filters.maxVolume) params.maxVolume = filters.maxVolume;
      if (filters.minDifficulty) params.minDifficulty = filters.minDifficulty;
      if (filters.maxDifficulty) params.maxDifficulty = filters.maxDifficulty;

      const response = await keywordsService.getByProject(selectedProject, params);
      setKeywords(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load keywords');
      }
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleApplyFilters = () => {
    fetchKeywords();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      searchEngine: '',
      device: '',
      intent: '',
      minVolume: '',
      maxVolume: '',
      minDifficulty: '',
      maxDifficulty: '',
    });
    setShowFilters(false);
  };

  const handleDelete = async (keywordId: string) => {
    if (!window.confirm('Are you sure you want to delete this keyword?')) {
      return;
    }

    try {
      await keywordsService.delete(keywordId);
      toast.success('Keyword deleted successfully');
      fetchKeywords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete keyword');
    }
  };

  const handleEdit = (keyword: Keyword) => {
    setEditingKeyword(keyword);
    setShowEditModal(true);
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

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return 'text-gray-500';
    if (difficulty < 30) return 'text-green-600';
    if (difficulty < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const selectedProjectData = Array.isArray(projects)
    ? projects.find((p) => p.id === selectedProject)
    : undefined;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Keywords</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and track your keywords across projects
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                showFilters
                  ? 'border-primary-600 text-primary-700 bg-primary-50'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!selectedProject}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Keywords
            </button>
          </div>
        </div>

        {/* Project Selector */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="flex-1 max-w-md rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {(!Array.isArray(projects) || projects.length === 0) && (
                <option value="">No projects available</option>
              )}
              {Array.isArray(projects) && projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.domain})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <KeywordFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        )}

        {/* Keywords Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : keywords.length === 0 ? (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No keywords</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedProject
                  ? 'Get started by adding your first keyword'
                  : 'Select a project to view keywords'}
              </p>
              {selectedProject && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Keywords
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engine / Device
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
                      Position
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {keywords.map((keyword) => (
                    <tr key={keyword.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {keyword.keyword}
                            </div>
                            <div className="text-xs text-gray-500">{keyword.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {keyword.searchEngine === 'google'
                            ? 'Google'
                            : keyword.searchEngine === 'bing'
                            ? 'Bing'
                            : 'YouTube'}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {keyword.device}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {keyword.searchVolume?.toLocaleString() || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${getDifficultyColor(
                            keyword.difficulty
                          )}`}
                        >
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
                        {keyword.latestRanking ? (
                          <div className="flex items-center">
                            <ChartBarIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              #{keyword.latestRanking.position}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not tracked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(keyword)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit keyword"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(keyword.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete keyword"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {keywords.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Keywords</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {keywords.length}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Avg. Volume</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {Math.round(
                    keywords.reduce((sum, k) => sum + (k.searchVolume || 0), 0) /
                      keywords.filter((k) => k.searchVolume).length || 0
                  ).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Avg. Difficulty</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {Math.round(
                    keywords.reduce((sum, k) => sum + (k.difficulty || 0), 0) /
                      keywords.filter((k) => k.difficulty).length || 0
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">With Rankings</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {keywords.filter((k) => k.latestRanking).length}
                </dd>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddKeywordModal
          projectId={selectedProject}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchKeywords();
          }}
        />
      )}

      {showEditModal && editingKeyword && (
        <EditKeywordModal
          keyword={editingKeyword}
          onClose={() => {
            setShowEditModal(false);
            setEditingKeyword(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingKeyword(null);
            fetchKeywords();
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default Keywords;
