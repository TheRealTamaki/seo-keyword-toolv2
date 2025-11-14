import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  TrophyIcon,
  LightBulbIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import toast from 'react-hot-toast';
import {
  projectsService,
  competitorsService,
} from '../services/api';
import KeywordGapAnalysis from '../components/Competitors/KeywordGapAnalysis';
import VisibilityComparison from '../components/Competitors/VisibilityComparison';
import QuickWinsTable from '../components/Competitors/QuickWinsTable';
import OpportunitiesPrioritization from '../components/Competitors/OpportunitiesPrioritization';
import CompetitorOverlap from '../components/Competitors/CompetitorOverlap';

interface Project {
  _id: string;
  name: string;
  domain: string;
}

interface Competitor {
  _id: string;
  domain: string;
  addedAt: string;
}

const Competitors: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [newCompetitorDomain, setNewCompetitorDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingCompetitor, setAddingCompetitor] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadCompetitors();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await projectsService.getAll();
      setProjects(response.data);
      if (response.data.length > 0) {
        setSelectedProject(response.data[0]._id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load projects');
    }
  };

  const loadCompetitors = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const response = await competitorsService.getByProject(selectedProject);
      setCompetitors(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load competitors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitorDomain.trim()) {
      toast.error('Please enter a competitor domain');
      return;
    }

    // Basic domain validation
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newCompetitorDomain.trim())) {
      toast.error('Please enter a valid domain (e.g., example.com)');
      return;
    }

    setAddingCompetitor(true);
    try {
      await competitorsService.create({
        projectId: selectedProject,
        domain: newCompetitorDomain.trim(),
      });
      toast('Competitor added successfully', { icon: '✅' });
      setNewCompetitorDomain('');
      loadCompetitors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add competitor');
    } finally {
      setAddingCompetitor(false);
    }
  };

  const handleDeleteCompetitor = async (competitorId: string, domain: string) => {
    if (!window.confirm(`Are you sure you want to remove ${domain} as a competitor?`)) {
      return;
    }

    try {
      await competitorsService.delete(competitorId);
      toast('Competitor removed successfully', { icon: '✅' });
      loadCompetitors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove competitor');
    }
  };

  const selectedProjectData = Array.isArray(projects)
    ? projects.find((p) => p._id === selectedProject)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competitor Analysis</h1>
          <p className="text-sm text-gray-600 mt-1">
            Compare your rankings with competitors and discover opportunities
          </p>
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Project
        </label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full md:w-1/3 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Select a project...</option>
          {Array.isArray(projects) && projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name} ({project.domain})
            </option>
          ))}
        </select>
      </div>

      {selectedProject && (
        <>
          {/* Competitor Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Your Competitors</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add competitor domains to track and analyze
                </p>
              </div>
            </div>

            {/* Add Competitor */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newCompetitorDomain}
                  onChange={(e) => setNewCompetitorDomain(e.target.value)}
                  placeholder="Enter competitor domain (e.g., example.com)"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCompetitor();
                    }
                  }}
                />
              </div>
              <button
                onClick={handleAddCompetitor}
                disabled={addingCompetitor}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Competitor
              </button>
            </div>

            {/* Competitors List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="text-sm text-gray-500 mt-2">Loading competitors...</p>
              </div>
            ) : competitors.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No competitors</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add competitor domains to start analyzing
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {competitors.map((competitor) => (
                  <div
                    key={competitor._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {competitor.domain}
                      </p>
                      <p className="text-xs text-gray-500">
                        Added {new Date(competitor.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCompetitor(competitor._id, competitor.domain)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Remove competitor"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analysis Tabs */}
          {competitors.length > 0 && (
            <Tab.Group>
              <div className="bg-white rounded-lg shadow">
                <Tab.List className="flex space-x-1 border-b border-gray-200 p-2">
                  <Tab
                    className={({ selected }) =>
                      `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        selected
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                    Keyword Gap
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        selected
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                    Visibility
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        selected
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    <TrophyIcon className="h-5 w-5 mr-2" />
                    Quick Wins
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        selected
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    <LightBulbIcon className="h-5 w-5 mr-2" />
                    Opportunities
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        selected
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                  >
                    <ChartPieIcon className="h-5 w-5 mr-2" />
                    Overlap
                  </Tab>
                </Tab.List>

                <Tab.Panels>
                  <Tab.Panel>
                    <KeywordGapAnalysis
                      projectId={selectedProject}
                      competitors={competitors}
                    />
                  </Tab.Panel>
                  <Tab.Panel>
                    <VisibilityComparison
                      projectId={selectedProject}
                      projectDomain={selectedProjectData?.domain || ''}
                      competitors={competitors}
                    />
                  </Tab.Panel>
                  <Tab.Panel>
                    <QuickWinsTable
                      projectId={selectedProject}
                      competitors={competitors}
                    />
                  </Tab.Panel>
                  <Tab.Panel>
                    <OpportunitiesPrioritization
                      projectId={selectedProject}
                      competitors={competitors}
                    />
                  </Tab.Panel>
                  <Tab.Panel>
                    <CompetitorOverlap
                      projectId={selectedProject}
                      competitors={competitors}
                    />
                  </Tab.Panel>
                </Tab.Panels>
              </div>
            </Tab.Group>
          )}
        </>
      )}

      {!selectedProject && (!Array.isArray(projects) || projects.length === 0) && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No projects yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a project first to start competitor analysis
          </p>
        </div>
      )}
    </div>
  );
};

export default Competitors;
