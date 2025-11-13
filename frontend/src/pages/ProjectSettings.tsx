import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsService, competitorsService } from '../services/api';
import { Project, Competitor } from '../types';
import DashboardLayout from '../components/Layout/DashboardLayout';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const ProjectSettings: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Project form state
  const [projectForm, setProjectForm] = useState({
    name: '',
    domain: '',
    description: '',
  });

  // Competitor form state
  const [newCompetitor, setNewCompetitor] = useState({ name: '', domain: '' });
  const [addingCompetitor, setAddingCompetitor] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
      fetchCompetitors();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    if (!projectId) return;

    try {
      const response = await projectsService.getById(projectId);
      if (response.data.success && response.data.data) {
        const proj = response.data.data;
        setProject(proj);
        setProjectForm({
          name: proj.name,
          domain: proj.domain,
          description: proj.description || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load project');
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitors = async () => {
    if (!projectId) return;

    try {
      const response = await competitorsService.getByProject(projectId);
      if (response.data.success) {
        setCompetitors(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching competitors:', error);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setSaving(true);
    try {
      await projectsService.update(projectId, projectForm);
      toast.success('Project updated successfully');
      fetchProjectData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setAddingCompetitor(true);
    try {
      const response = await competitorsService.create({
        projectId,
        name: newCompetitor.name,
        domain: newCompetitor.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
      });

      if (response.data.success) {
        toast.success('Competitor added successfully');
        setNewCompetitor({ name: '', domain: '' });
        fetchCompetitors();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add competitor');
    } finally {
      setAddingCompetitor(false);
    }
  };

  const handleDeleteCompetitor = async (competitorId: string) => {
    try {
      await competitorsService.delete(competitorId);
      toast.success('Competitor removed');
      fetchCompetitors();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove competitor');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId || deleteConfirmText.toLowerCase() !== 'delete') return;

    setDeleting(true);
    try {
      await projectsService.delete(projectId);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete project');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Project not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center">
          <button
            onClick={() => navigate('/projects')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Settings</h1>
            <p className="mt-1 text-sm text-gray-600">{project.name}</p>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General Information</h2>
          <form onSubmit={handleSaveProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
              <input
                type="text"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <input
                type="text"
                value={projectForm.domain}
                onChange={(e) => setProjectForm({ ...projectForm, domain: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Competitors */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Competitors</h2>

          {/* Add Competitor Form */}
          <form onSubmit={handleAddCompetitor} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newCompetitor.name}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                placeholder="Competitor name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                value={newCompetitor.domain}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, domain: e.target.value })}
                placeholder="competitor.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={addingCompetitor}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add
              </button>
            </div>
          </form>

          {/* Competitors List */}
          {competitors.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No competitors added yet. Add your first competitor above.
            </p>
          ) : (
            <div className="space-y-2">
              {competitors.map((competitor) => (
                <div
                  key={competitor.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{competitor.name}</p>
                    <p className="text-sm text-gray-500">{competitor.domain}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCompetitor(competitor.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete a project, there is no going back. All data including keywords,
                rankings, and reports will be permanently deleted.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete This Project
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type <strong>DELETE</strong> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Type DELETE"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteProject}
                      disabled={deleteConfirmText.toLowerCase() !== 'delete' || deleting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? 'Deleting...' : 'Permanently Delete Project'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectSettings;
