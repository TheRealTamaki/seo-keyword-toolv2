import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { alertsService, projectsService } from '../services/api';
import { PlusIcon, BellIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../components/Layout/DashboardLayout';
import {
  AlertCard,
  CreateAlertModal,
  DeleteAlertDialog,
  AlertHistory,
  Alert,
  AlertFormData,
  AlertHistoryItem,
} from '../components/Alerts';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  name: string;
}

const Alerts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get('project');

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<AlertHistoryItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectIdParam]);

  const fetchData = async () => {
    try {
      // Fetch alerts and projects in parallel
      const [alertsRes, projectsRes, historyRes] = await Promise.allSettled([
        alertsService.getAll(projectIdParam ? { projectId: projectIdParam } : undefined),
        projectsService.getAll(),
        alertsService.getHistory(projectIdParam ? { projectId: projectIdParam, limit: 50 } : { limit: 50 }),
      ]);

      // Handle alerts
      if (alertsRes.status === 'fulfilled' && alertsRes.value.data.success) {
        setAlerts(alertsRes.value.data.data || []);
      }
      setLoading(false);

      // Handle projects
      if (projectsRes.status === 'fulfilled' && projectsRes.value.data.success) {
        const projectsData = projectsRes.value.data.data || [];
        setProjects(projectsData.map((p: any) => ({ id: p.id, name: p.name })));
      }

      // Handle history
      if (historyRes.status === 'fulfilled' && historyRes.value.data.success) {
        setHistory(historyRes.value.data.data || []);
      }
      setLoadingHistory(false);
    } catch (error) {
      console.error('Error fetching alerts data:', error);
      toast.error('Failed to load alerts');
      setLoading(false);
      setLoadingHistory(false);
    }
  };

  const handleCreateAlert = async (data: AlertFormData) => {
    try {
      const response = await alertsService.create(data);
      if (response.data.success) {
        toast.success('Alert created successfully!');
        setShowCreateModal(false);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create alert');
      throw error;
    }
  };

  const handleToggleAlert = async (alert: Alert) => {
    try {
      const response = await alertsService.update(alert.id, {
        enabled: !alert.enabled,
      });
      if (response.data.success) {
        toast.success(`Alert ${!alert.enabled ? 'enabled' : 'disabled'}`);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update alert');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await alertsService.delete(id);
      toast.success('Alert deleted successfully');
      setShowDeleteDialog(false);
      setSelectedAlert(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete alert');
      throw error;
    }
  };

  const handleOpenEdit = (alert: Alert) => {
    // For simplicity, we'll use the create modal with pre-filled data
    // In a full implementation, you'd create a separate EditAlertModal
    toast('Edit functionality coming soon!', {
      icon: 'ℹ️',
    });
  };

  const handleOpenDelete = (alert: Alert) => {
    setSelectedAlert(alert);
    setShowDeleteDialog(true);
  };

  // Get project name for an alert
  const getProjectName = (projectId: string | null): string | undefined => {
    if (!projectId) return undefined;
    return projects.find((p) => p.id === projectId)?.name;
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
            <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
            <p className="mt-2 text-sm text-gray-600">
              Configure automated notifications for ranking changes and SEO events
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Alert
          </button>
        </div>

        {/* Empty State */}
        {alerts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No alerts configured</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first alert to monitor keyword rankings and changes
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Alert
            </button>
          </div>
        ) : (
          <>
            {/* Alerts List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Active Alerts ({alerts.filter((a) => a.enabled).length} of {alerts.length})
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    projectName={getProjectName(alert.projectId)}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                    onToggle={handleToggleAlert}
                  />
                ))}
              </div>
            </div>

            {/* Alert History */}
            <AlertHistory history={history} loading={loadingHistory} />
          </>
        )}

        {/* Create Alert Modal */}
        <CreateAlertModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAlert}
          projects={projects}
        />

        {/* Delete Alert Dialog */}
        <DeleteAlertDialog
          isOpen={showDeleteDialog}
          alert={selectedAlert}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedAlert(null);
          }}
          onConfirm={handleDeleteAlert}
        />
      </div>
    </DashboardLayout>
  );
};

export default Alerts;
