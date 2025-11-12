import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { notificationPreferencesService } from '../../services/api';
import { Switch } from '@headlessui/react';
import classNames from 'classnames';
import {
  EnvelopeIcon,
  BellIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface NotificationPreferences {
  emailEnabled: boolean;
  emailRecipients: string[];
  webhookEnabled: boolean;
  webhookUrl?: string;
  webhookType?: 'slack' | 'discord' | 'custom';
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  digestTime?: string;
  digestDayOfWeek?: number;
}

const NotificationPreferences: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    emailRecipients: [],
    webhookEnabled: false,
    frequency: 'immediate',
    quietHoursEnabled: false,
  });

  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await notificationPreferencesService.get();
      if (response.data.success && response.data.data) {
        setPreferences(response.data.data);
      }
    } catch (error: any) {
      // If no preferences exist yet, use defaults
      if (error.response?.status !== 404) {
        toast.error('Failed to load notification preferences');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await notificationPreferencesService.update(preferences);
      if (response.data.success) {
        toast.success('Notification preferences saved successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmail = () => {
    const email = newEmail.trim();
    if (!email) {
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (preferences.emailRecipients.includes(email)) {
      toast.error('Email already added');
      return;
    }

    setPreferences({
      ...preferences,
      emailRecipients: [...preferences.emailRecipients, email],
    });
    setNewEmail('');
    toast.success('Email added');
  };

  const handleRemoveEmail = (email: string) => {
    setPreferences({
      ...preferences,
      emailRecipients: preferences.emailRecipients.filter((e) => e !== email),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <EnvelopeIcon className="h-6 w-6 text-gray-400 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                Receive alert notifications via email
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.emailEnabled}
            onChange={(checked) =>
              setPreferences({ ...preferences, emailEnabled: checked })
            }
            className={classNames(
              preferences.emailEnabled ? 'bg-primary-600' : 'bg-gray-200',
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
            )}
          >
            <span
              className={classNames(
                preferences.emailEnabled ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
              )}
            />
          </Switch>
        </div>

        {preferences.emailEnabled && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Recipients
              </label>
              <div className="mt-2 space-y-2">
                {preferences.emailRecipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2"
                  >
                    <span className="text-sm text-gray-700">{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex space-x-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                  placeholder="email@example.com"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                />
                <button
                  onClick={handleAddEmail}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Notifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <BellIcon className="h-6 w-6 text-gray-400 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Webhook Notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                Send notifications to Slack, Discord, or custom webhook
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.webhookEnabled}
            onChange={(checked) =>
              setPreferences({ ...preferences, webhookEnabled: checked })
            }
            className={classNames(
              preferences.webhookEnabled ? 'bg-primary-600' : 'bg-gray-200',
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
            )}
          >
            <span
              className={classNames(
                preferences.webhookEnabled ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
              )}
            />
          </Switch>
        </div>

        {preferences.webhookEnabled && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Webhook Type
              </label>
              <select
                value={preferences.webhookType || 'custom'}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    webhookType: e.target.value as 'slack' | 'discord' | 'custom',
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="slack">Slack</option>
                <option value="discord">Discord</option>
                <option value="custom">Custom Webhook</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Webhook URL
              </label>
              <input
                type="url"
                value={preferences.webhookUrl || ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, webhookUrl: e.target.value })
                }
                placeholder="https://hooks.slack.com/services/..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Notification Frequency */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <ClockIcon className="h-6 w-6 text-gray-400 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">Notification Frequency</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose how often you want to receive notifications
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="immediate"
                  checked={preferences.frequency === 'immediate'}
                  onChange={(e) =>
                    setPreferences({ ...preferences, frequency: e.target.value as any })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Immediate</span>
                  <span className="block text-sm text-gray-500">
                    Get notified as soon as an alert is triggered
                  </span>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  value="daily"
                  checked={preferences.frequency === 'daily'}
                  onChange={(e) =>
                    setPreferences({ ...preferences, frequency: e.target.value as any })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Daily Digest</span>
                  <span className="block text-sm text-gray-500">
                    Receive a summary once per day
                  </span>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  value="weekly"
                  checked={preferences.frequency === 'weekly'}
                  onChange={(e) =>
                    setPreferences({ ...preferences, frequency: e.target.value as any })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Weekly Digest</span>
                  <span className="block text-sm text-gray-500">
                    Receive a summary once per week
                  </span>
                </span>
              </label>
            </div>

            {preferences.frequency === 'daily' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Daily Digest Time
                </label>
                <input
                  type="time"
                  value={preferences.digestTime || '09:00'}
                  onChange={(e) =>
                    setPreferences({ ...preferences, digestTime: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            )}

            {preferences.frequency === 'weekly' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Day of Week
                </label>
                <select
                  value={preferences.digestDayOfWeek || 1}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      digestDayOfWeek: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Quiet Hours</h3>
            <p className="mt-1 text-sm text-gray-500">
              Don't send notifications during specific hours
            </p>
          </div>
          <Switch
            checked={preferences.quietHoursEnabled}
            onChange={(checked) =>
              setPreferences({ ...preferences, quietHoursEnabled: checked })
            }
            className={classNames(
              preferences.quietHoursEnabled ? 'bg-primary-600' : 'bg-gray-200',
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
            )}
          >
            <span
              className={classNames(
                preferences.quietHoursEnabled ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
              )}
            />
          </Switch>
        </div>

        {preferences.quietHoursEnabled && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                value={preferences.quietHoursStart || '22:00'}
                onChange={(e) =>
                  setPreferences({ ...preferences, quietHoursStart: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                value={preferences.quietHoursEnd || '08:00'}
                onChange={(e) =>
                  setPreferences({ ...preferences, quietHoursEnd: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
