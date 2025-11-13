import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/Layout/DashboardLayout';
import {
  ReportCard,
  CreateReportModal,
  ScheduleReportModal,
  DeleteReportDialog,
  ReportHistory,
  ReportTemplate,
  ReportFormData,
  ScheduleFormData,
  ReportHistoryItem,
} from '../components/Reports';
import { reportsService, projectsService } from '../services/api';

interface Project {
  id: string;
  name: string;
  domain: string;
}

const Reports: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get('project');

  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  useEffect(() => {
    loadData();
  }, [projectIdParam]);

  const loadData = async () => {
    setLoading(true);
    setHistoryLoading(true);

    try {
      const [templatesRes, projectsRes, historyRes] = await Promise.allSettled([
        reportsService.getTemplates(projectIdParam ? { projectId: projectIdParam } : undefined),
        projectsService.getAll(),
        reportsService.getHistory(projectIdParam ? { projectId: projectIdParam, limit: 50 } : { limit: 50 }),
      ]);

      if (templatesRes.status === 'fulfilled') {
        setTemplates(templatesRes.value.data.templates || []);
      } else {
        console.error('Error loading templates:', templatesRes.reason);
        toast.error('Failed to load report templates');
      }

      if (projectsRes.status === 'fulfilled') {
        setProjects(projectsRes.value.data.projects || []);
      }

      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value.data.history || []);
      } else {
        console.error('Error loading history:', historyRes.reason);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
      setHistoryLoading(false);
    }
  };

  const handleCreateTemplate = async (data: ReportFormData) => {
    try {
      await reportsService.createTemplate(data);
      toast.success('Report template created successfully!');
      await loadData();
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast.error(error.response?.data?.error || 'Failed to create template');
      throw error;
    }
  };

  const handleScheduleReport = async (data: ScheduleFormData) => {
    try {
      await reportsService.createSchedule(data);
      toast.success('Report scheduled successfully!');
      setIsScheduleModalOpen(false);
      setSelectedTemplate(null);
    } catch (error: any) {
      console.error('Error scheduling report:', error);
      toast.error(error.response?.data?.error || 'Failed to schedule report');
      throw error;
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await reportsService.deleteTemplate(id);
      toast.success('Report template deleted successfully!');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(error.response?.data?.error || 'Failed to delete template');
      throw error;
    }
  };

  const handleGenerateReport = async (template: ReportTemplate) => {
    try {
      toast('Generating report...', { icon: '⏳' });
      await reportsService.generateReport(template.id);
      toast.success('Report generation started! Check history for progress.');
      await loadData();
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.error || 'Failed to generate report');
    }
  };

  const handleDownloadReport = async (item: ReportHistoryItem) => {
    try {
      const response = await reportsService.downloadReport(item.id);

      // Create a blob from the response and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.templateName}_${new Date(item.generatedAt).toISOString().split('T')[0]}.${item.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully!');
    } catch (error: any) {
      console.error('Error downloading report:', error);
      toast.error(error.response?.data?.error || 'Failed to download report');
    }
  };

  const handleEditTemplate = (template: ReportTemplate) => {
    toast('Edit functionality coming soon!', {
      icon: 'ℹ️',
    });
  };

  const handleSchedule = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setIsScheduleModalOpen(true);
  };

  const handleDelete = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">
              Create, schedule, and manage your SEO reports
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Template
          </button>
        </div>

        {/* Templates */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Templates</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No report templates yet. Create your first template!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => {
                const project = template.projectId
                  ? projects.find((p) => p.id === template.projectId)
                  : undefined;

                return (
                  <ReportCard
                    key={template.id}
                    report={template}
                    projectName={project?.name}
                    onEdit={handleEditTemplate}
                    onDelete={handleDelete}
                    onSchedule={handleSchedule}
                    onGenerate={handleGenerateReport}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* History */}
        <ReportHistory
          history={history}
          loading={historyLoading}
          onDownload={handleDownloadReport}
        />

        {/* Modals */}
        <CreateReportModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTemplate}
          projects={projects}
        />

        <ScheduleReportModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setSelectedTemplate(null);
          }}
          onSubmit={handleScheduleReport}
          template={selectedTemplate}
        />

        <DeleteReportDialog
          isOpen={isDeleteDialogOpen}
          template={selectedTemplate}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedTemplate(null);
          }}
          onConfirm={handleDeleteTemplate}
        />
      </div>
    </DashboardLayout>
  );
};

export default Reports;
