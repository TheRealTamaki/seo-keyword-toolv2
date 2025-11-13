import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDownIcon, FolderIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { projectsService } from '../../services/api';
import { Project } from '../../types';

interface ProjectSwitcherProps {
  onCreateProject?: () => void;
}

const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({ onCreateProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchProjects();
  }, []);

  // Get selected project from URL params
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId && projects.length > 0) {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setSelectedProject(project);
      }
    } else if (projects.length > 0 && !selectedProject) {
      // Auto-select first project if none selected
      setSelectedProject(projects[0]);
      setSearchParams({ project: projects[0].id });
    }
  }, [projects, searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsService.getAll();
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setSearchParams({ project: project.id });
    setIsOpen(false);
  };

  const handleCreateProject = () => {
    setIsOpen(false);
    if (onCreateProject) {
      onCreateProject();
    } else {
      navigate('/projects');
    }
  };

  if (loading) {
    return (
      <div className="px-2 py-2">
        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="px-2 py-2">
        <button
          onClick={handleCreateProject}
          className="w-full flex items-center justify-center px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Create Project</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 py-2 border-b border-gray-200" ref={dropdownRef}>
      <div className="relative">
        {/* Selected Project Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex items-center min-w-0 flex-1">
            <FolderIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />
            <div className="ml-2 min-w-0 flex-1 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedProject?.name || 'Select Project'}
              </p>
              {selectedProject && (
                <p className="text-xs text-gray-500 truncate">{selectedProject.domain}</p>
              )}
            </div>
          </div>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 flex-shrink-0 ml-2 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            {/* Projects List */}
            <div className="py-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <FolderIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="ml-2 min-w-0 flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                      <p className="text-xs text-gray-500 truncate">{project.domain}</p>
                    </div>
                  </div>
                  {selectedProject?.id === project.id && (
                    <CheckIcon className="h-5 w-5 text-primary-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>

            {/* Create New Project */}
            <div className="border-t border-gray-200 py-1">
              <button
                onClick={handleCreateProject}
                className="w-full flex items-center px-3 py-2 text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Create New Project</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSwitcher;
