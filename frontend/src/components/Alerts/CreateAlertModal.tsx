import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AlertType } from './AlertCard';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AlertFormData) => Promise<void>;
  projects: Array<{ id: string; name: string }>;
}

export interface AlertFormData {
  projectId?: string;
  name: string;
  description?: string;
  alertType: AlertType;
  conditions: Record<string, any>;
  emailEnabled: boolean;
  emailAddresses?: string[];
  webhookEnabled: boolean;
  webhookUrl?: string;
  webhookType?: 'slack' | 'discord' | 'custom';
  notificationFrequency: 'immediate' | 'daily_digest' | 'weekly_digest';
}

const alertTypes: { value: AlertType; label: string; description: string }[] = [
  {
    value: 'rank_improvement',
    label: 'Rank Improvement',
    description: 'Alert when keyword rank improves',
  },
  { value: 'rank_drop', label: 'Rank Drop', description: 'Alert when keyword rank drops' },
  {
    value: 'rank_change',
    label: 'Rank Change',
    description: 'Alert on any rank change',
  },
  {
    value: 'new_ranking',
    label: 'New Ranking',
    description: 'Alert when keyword enters top results',
  },
  {
    value: 'lost_ranking',
    label: 'Lost Ranking',
    description: 'Alert when keyword falls out of top results',
  },
  {
    value: 'serp_feature',
    label: 'SERP Feature',
    description: 'Alert on SERP feature changes',
  },
  {
    value: 'competitor_movement',
    label: 'Competitor Movement',
    description: 'Alert on competitor rank changes',
  },
];

const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
}) => {
  const [formData, setFormData] = useState<AlertFormData>({
    name: '',
    description: '',
    alertType: 'rank_improvement',
    conditions: {},
    emailEnabled: false,
    emailAddresses: [],
    webhookEnabled: false,
    notificationFrequency: 'immediate',
  });

  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        alertType: 'rank_improvement',
        conditions: {},
        emailEnabled: false,
        emailAddresses: [],
        webhookEnabled: false,
        notificationFrequency: 'immediate',
      });
      setEmailInput('');
      setErrors({});
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Alert name is required';
    }

    if (formData.emailEnabled && (!formData.emailAddresses || formData.emailAddresses.length === 0)) {
      newErrors.email = 'At least one email address is required';
    }

    if (formData.webhookEnabled && !formData.webhookUrl) {
      newErrors.webhook = 'Webhook URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormData({
        ...formData,
        emailAddresses: [...(formData.emailAddresses || []), email],
      });
      setEmailInput('');
      setErrors({ ...errors, email: '' });
    }
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = [...(formData.emailAddresses || [])];
    newEmails.splice(index, 1);
    setFormData({ ...formData, emailAddresses: newEmails });
  };

  const renderConditionFields = () => {
    switch (formData.alertType) {
      case 'rank_improvement':
      case 'rank_drop':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Change (positions)
              </label>
              <input
                type="number"
                min="1"
                value={formData.conditions.minChange || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    conditions: { ...formData.conditions, minChange: parseInt(e.target.value) || 1 },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., 5"
              />
            </div>
          </div>
        );

      case 'new_ranking':
      case 'lost_ranking':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position Threshold
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.conditions.positionThreshold || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    positionThreshold: parseInt(e.target.value) || 10,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 10 (top 10)"
            />
          </div>
        );

      case 'serp_feature':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SERP Features (comma separated)
            </label>
            <input
              type="text"
              value={formData.conditions.features || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, features: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., featured_snippet, people_also_ask"
            />
          </div>
        );

      default:
        return null;
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
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create New Alert</h3>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="My Alert"
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
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value || undefined })}
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

              {/* Alert Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.alertType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alertType: e.target.value as AlertType,
                      conditions: {},
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {alertTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditions */}
              {renderConditionFields()}

              {/* Notification Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notification Frequency
                </label>
                <select
                  value={formData.notificationFrequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notificationFrequency: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily_digest">Daily Digest</option>
                  <option value="weekly_digest">Weekly Digest</option>
                </select>
              </div>

              {/* Email Notifications */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={formData.emailEnabled}
                    onChange={(e) =>
                      setFormData({ ...formData, emailEnabled: e.target.checked })
                    }
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Enable Email Notifications
                  </span>
                </label>

                {formData.emailEnabled && (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="email@example.com"
                      />
                      <button
                        type="button"
                        onClick={handleAddEmail}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Add
                      </button>
                    </div>

                    {formData.emailAddresses && formData.emailAddresses.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.emailAddresses.map((email, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => handleRemoveEmail(index)}
                              className="ml-2 text-primary-600 hover:text-primary-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                )}
              </div>

              {/* Webhook Notifications */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={formData.webhookEnabled}
                    onChange={(e) =>
                      setFormData({ ...formData, webhookEnabled: e.target.checked })
                    }
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Enable Webhook Notifications
                  </span>
                </label>

                {formData.webhookEnabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook Type
                      </label>
                      <select
                        value={formData.webhookType || 'custom'}
                        onChange={(e) =>
                          setFormData({ ...formData, webhookType: e.target.value as any })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="slack">Slack</option>
                        <option value="discord">Discord</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook URL
                      </label>
                      <input
                        type="url"
                        value={formData.webhookUrl || ''}
                        onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.webhook ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="https://..."
                      />
                      {errors.webhook && (
                        <p className="mt-1 text-sm text-red-600">{errors.webhook}</p>
                      )}
                    </div>
                  </div>
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
                  {isSubmitting ? 'Creating...' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAlertModal;
