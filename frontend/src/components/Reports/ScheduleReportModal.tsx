import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ReportTemplate } from './ReportCard';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  template: ReportTemplate | null;
}

export interface ScheduleFormData {
  templateId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom_cron';
  cronExpression?: string;
  timezone: string;
  deliveryMethod: 'email' | 'webhook' | 'storage';
  emailAddresses?: string[];
  webhookUrl?: string;
  isActive: boolean;
}

const frequencyOptions = [
  { value: 'daily', label: 'Daily', description: 'Generate every day at specified time' },
  { value: 'weekly', label: 'Weekly', description: 'Generate once a week' },
  { value: 'monthly', label: 'Monthly', description: 'Generate once a month' },
  { value: 'custom_cron', label: 'Custom (Cron)', description: 'Use custom cron expression' },
];

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const ScheduleReportModal: React.FC<ScheduleReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  template,
}) => {
  const [formData, setFormData] = useState<ScheduleFormData>({
    templateId: '',
    frequency: 'weekly',
    timezone: 'UTC',
    deliveryMethod: 'email',
    emailAddresses: [],
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    if (isOpen && template) {
      setFormData({
        templateId: template.id,
        frequency: 'weekly',
        timezone: 'UTC',
        deliveryMethod: 'email',
        emailAddresses: [],
        isActive: true,
      });
      setEmailInput('');
      setErrors({});
    }
  }, [isOpen, template]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.frequency === 'custom_cron' && !formData.cronExpression?.trim()) {
      newErrors.cronExpression = 'Cron expression is required for custom frequency';
    }

    if (formData.deliveryMethod === 'email') {
      if (!formData.emailAddresses || formData.emailAddresses.length === 0) {
        newErrors.emailAddresses = 'At least one email address is required';
      }
    }

    if (formData.deliveryMethod === 'webhook' && !formData.webhookUrl?.trim()) {
      newErrors.webhookUrl = 'Webhook URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ ...errors, emailInput: 'Invalid email address' });
      return;
    }

    if (formData.emailAddresses?.includes(email)) {
      setErrors({ ...errors, emailInput: 'Email already added' });
      return;
    }

    setFormData({
      ...formData,
      emailAddresses: [...(formData.emailAddresses || []), email],
    });
    setEmailInput('');
    setErrors({ ...errors, emailInput: '', emailAddresses: '' });
  };

  const handleRemoveEmail = (email: string) => {
    setFormData({
      ...formData,
      emailAddresses: formData.emailAddresses?.filter((e) => e !== email),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error scheduling report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !template) return null;

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
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Schedule Report</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Template: <strong>{template.name}</strong>
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequency: e.target.value as ScheduleFormData['frequency'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Cron Expression */}
              {formData.frequency === 'custom_cron' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cron Expression <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cronExpression || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, cronExpression: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.cronExpression ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0 9 * * *"
                  />
                  {errors.cronExpression && (
                    <p className="mt-1 text-sm text-red-600">{errors.cronExpression}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Example: "0 9 * * *" runs daily at 9:00 AM
                  </p>
                </div>
              )}

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.deliveryMethod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryMethod: e.target.value as ScheduleFormData['deliveryMethod'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="email">Email</option>
                  <option value="webhook">Webhook</option>
                  <option value="storage">Storage Only</option>
                </select>
              </div>

              {/* Email Addresses */}
              {formData.deliveryMethod === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Addresses <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEmail();
                        }
                      }}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.emailInput ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="email@example.com"
                    />
                    <button
                      type="button"
                      onClick={handleAddEmail}
                      className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                  {errors.emailInput && (
                    <p className="mt-1 text-sm text-red-600">{errors.emailInput}</p>
                  )}
                  {errors.emailAddresses && (
                    <p className="mt-1 text-sm text-red-600">{errors.emailAddresses}</p>
                  )}

                  {/* Email List */}
                  {formData.emailAddresses && formData.emailAddresses.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formData.emailAddresses.map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-700">{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Webhook URL */}
              {formData.deliveryMethod === 'webhook' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.webhookUrl || ''}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.webhookUrl ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="https://example.com/webhook"
                  />
                  {errors.webhookUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.webhookUrl}</p>
                  )}
                </div>
              )}

              {/* Active Status */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Active (schedule will run immediately)
                </span>
              </label>

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
                  {isSubmitting ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleReportModal;
