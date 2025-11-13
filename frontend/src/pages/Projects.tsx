import React, { useEffect, useState } from 'react';
import { projectsService, keywordsService, competitorsService } from '../services/api';
import { PlusIcon, FolderIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../components/Layout/DashboardLayout';
import ProjectCard from '../components/Projects/ProjectCard';
import CreateProjectModal from '../components/Projects/CreateProjectModal';
import EditProjectModal from '../components/Projects/EditProjectModal';
import DeleteProjectDialog from '../components/Projects/DeleteProjectDialog';
import toast from 'react-hot-toast';
import { Project } from '../types';

interface ProjectWithStats extends Project {
  stats?: {
    totalKeywords: number;
    trackedKeywords: number;
    avgRank?: number;
    totalCompetitors: number;
  };
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsService.getAll();
      if (response.data.success) {
        const projectsData = response.data.data || [];
        setProjects(projectsData);

        // Fetch stats for each project
        if (projectsData.length > 0) {
          fetchProjectsStats(projectsData);
        }
      }
    } catch (error) {
      toast.error('Failed to load projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsStats = async (projectsList: Project[]) => {
    setLoadingStats(true);
    try {
      const projectsWithStats = await Promise.all(
        projectsList.map(async (project) => {
          try {
            // Fetch keywords for this project
            const keywordsResponse = await keywordsService.getByProject(project.id);
            const keywords = keywordsResponse.data.data || [];

            // Fetch competitors for this project
            const competitorsResponse = await competitorsService.getByProject(project.id);
            const competitors = competitorsResponse.data.data || [];

            // Fetch keywords with rankings to calculate average
            const rankedKeywordsResponse = await keywordsService.getWithRankings(project.id);
            const rankedKeywords = rankedKeywordsResponse.data.data || [];

            // Calculate average rank
            let avgRank = undefined;
            if (rankedKeywords.length > 0) {
              const ranks = rankedKeywords
                .map((kw: any) => kw.currentRank)
                .filter((rank: number) => rank > 0);
              if (ranks.length > 0) {
                avgRank = ranks.reduce((a: number, b: number) => a + b, 0) / ranks.length;
              }
            }

            return {
              ...project,
              stats: {
                totalKeywords: keywords.length,
                trackedKeywords: rankedKeywords.length,
                avgRank,
                totalCompetitors: competitors.length,
              },
            };
          } catch (error) {
            console.error(`Error fetching stats for project ${project.id}:`, error);
            return project;
          }
        })
      );

      setProjects(projectsWithStats);
    } catch (error) {
      console.error('Error fetching project stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCreateProject = async (data: {
    name: string;
    domain: string;
    description?: string;
  }) => {
    try {
      const response = await projectsService.create(data);
      if (response.data.success) {
        toast.success('Project created successfully!');
        setShowCreateModal(false);
        fetchProjects();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create project');
      throw error;
    }
  };

  const handleEditProject = async (
    id: string,
    data: { name: string; domain: string; description?: string }
  ) => {
    try {
      const response = await projectsService.update(id, data);
      if (response.data.success) {
        toast.success('Project updated successfully!');
        setShowEditModal(false);
        setSelectedProject(null);
        fetchProjects();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update project');
      throw error;
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await projectsService.delete(id);
      toast.success('Project deleted successfully');
      setShowDeleteDialog(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete project');
      throw error;
    }
  };

  const handleOpenEdit = (project: Project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleOpenDelete = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your SEO projects and track keywords across domains
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No projects yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first SEO project to track keywords and rankings
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Project
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  stats={project.stats}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              ))}
            </div>

            {loadingStats && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Loading project statistics...</p>
              </div>
            )}
          </>
        )}

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />

        {/* Edit Project Modal */}
        <EditProjectModal
          isOpen={showEditModal}
          project={selectedProject}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProject(null);
          }}
          onSubmit={handleEditProject}
        />

        {/* Delete Project Dialog */}
        <DeleteProjectDialog
          isOpen={showDeleteDialog}
          project={selectedProject}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedProject(null);
          }}
          onConfirm={handleDeleteProject}
        />
      </div>
    </DashboardLayout>
  );
};

export default Projects;
