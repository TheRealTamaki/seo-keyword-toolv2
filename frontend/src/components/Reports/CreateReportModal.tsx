import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ReportType, ReportFormat } from './ReportCard';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReportFormData) => Promise<void>;
  projects: Array<{ id: string; name: string }>;
}

export interface ReportFormData {
  projectId?: string;
  name: string;
  description?: string;
  reportType: ReportType;
  config: Record<string, any>;
  format: ReportFormat;
  branding?: Record<string, any>;
}

const reportTypes: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'ranking_performance',
    label: 'Ranking Performance',
    description: 'Track keyword ranking changes over time',
  },
  {
    value: 'keyword_research',
    label: 'Keyword Research',
    description: 'Analyze keyword opportunities and metrics',
  },
  {
    value: 'competitor_analysis',
    label: 'Competitor Analysis',
    description: 'Compare performance with competitors',
  },
  {
    value: 'project_overview',
    label: 'Project Overview',
    description: 'Comprehensive project statistics',
  },
  {
    value: 'custom',
    label: 'Custom Report',
    description: 'Create a custom report with specific metrics',
  },
];

const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
}) => {
  const [formData, setFormData] = useState<ReportFormData>({
    name: '',
    description: '',
    reportType: 'ranking_performance',
    config: {},
    format: 'pdf',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Config fields based on report type
  const [dateRange, setDateRange] = useState('30');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeKeywords, setIncludeKeywords] = useState(true);
  const [includeCompetitors, setIncludeCompetitors] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        reportType: 'ranking_performance',
        config: {},
        format: 'pdf',
      });
      setDateRange('30');
      setIncludeCharts(true);
      setIncludeKeywords(true);
      setIncludeCompetitors(false);
      setErrors({});
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Report name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Build config based on report type
    const config: Record<string, any> = {
      dateRange: parseInt(dateRange),
      includeCharts,
    };

    if (formData.reportType === 'ranking_performance') {
      config.includeKeywords = includeKeywords;
      config.includeHistoricalData = true;
    } else if (formData.reportType === 'competitor_analysis') {
      config.includeCompetitors = includeCompetitors;
      config.compareRankings = true;
    } else if (formData.reportType === 'project_overview') {
      config.includeSummary = true;
      config.includeKeywords = includeKeywords;
      config.includeCompetitors = includeCompetitors;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        config,
      });
      onClose();
    } catch (error) {
      console.error('Error creating report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create Report Template</h3>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Monthly Ranking Report"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Optional description..."
                />
              </div>

              {/* Project */}
              {projects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project (Optional)
                  </label>
                  <select
                    value={formData.projectId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, projectId: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) =>
                    setFormData({ ...formData, reportType: e.target.value as ReportType })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.format}
                  onChange={(e) =>
                    setFormData({ ...formData, format: e.target.value as ReportFormat })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              {/* Configuration Options */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Report Configuration</h4>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range (days)
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="180">Last 6 months</option>
                    <option value="365">Last year</option>
                  </select>
                </div>

                {/* Include Charts */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Charts & Visualizations</span>
                </label>

                {/* Type-specific options */}
                {(formData.reportType === 'ranking_performance' ||
                  formData.reportType === 'project_overview') && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeKeywords}
                      onChange={(e) => setIncludeKeywords(e.target.checked)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Keyword Details</span>
                  </label>
                )}

                {(formData.reportType === 'competitor_analysis' ||
                  formData.reportType === 'project_overview') && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeCompetitors}
                      onChange={(e) => setIncludeCompetitors(e.target.checked)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Competitor Comparison</span>
                  </label>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReportModal;
