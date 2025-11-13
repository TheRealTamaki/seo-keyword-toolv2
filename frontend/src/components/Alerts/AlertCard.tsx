import React from 'react';
import {
  BellIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';

export type AlertType =
  | 'rank_change'
  | 'rank_improvement'
  | 'rank_drop'
  | 'serp_feature'
  | 'competitor_movement'
  | 'new_ranking'
  | 'lost_ranking';

export interface Alert {
  id: string;
  projectId: string | null;
  name: string;
  description: string | null;
  alertType: AlertType;
  conditions: Record<string, any>;
  enabled: boolean;
  emailEnabled: boolean;
  emailAddresses: string[] | null;
  webhookEnabled: boolean;
  webhookUrl: string | null;
  webhookType: string | null;
  notificationFrequency: string;
  lastTriggeredAt: string | null;
  createdAt: string;
}

interface AlertCardProps {
  alert: Alert;
  projectName?: string;
  onEdit: (alert: Alert) => void;
  onDelete: (alert: Alert) => void;
  onToggle: (alert: Alert) => void;
}

const alertTypeLabels: Record<AlertType, string> = {
  rank_change: 'Rank Change',
  rank_improvement: 'Rank Improvement',
  rank_drop: 'Rank Drop',
  serp_feature: 'SERP Feature',
  competitor_movement: 'Competitor Movement',
  new_ranking: 'New Ranking',
  lost_ranking: 'Lost Ranking',
};

const alertTypeColors: Record<AlertType, string> = {
  rank_change: 'bg-blue-100 text-blue-800',
  rank_improvement: 'bg-green-100 text-green-800',
  rank_drop: 'bg-red-100 text-red-800',
  serp_feature: 'bg-purple-100 text-purple-800',
  competitor_movement: 'bg-orange-100 text-orange-800',
  new_ranking: 'bg-teal-100 text-teal-800',
  lost_ranking: 'bg-gray-100 text-gray-800',
};

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  projectName,
  onEdit,
  onDelete,
  onToggle,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1 min-w-0">
          <div
            className={`flex-shrink-0 p-2 rounded-lg ${
              alert.enabled ? 'bg-primary-100' : 'bg-gray-100'
            }`}
          >
            {alert.enabled ? (
              <BellAlertIcon className="h-6 w-6 text-primary-600" />
            ) : (
              <BellIcon className="h-6 w-6 text-gray-400" />
            )}
          </div>

          <div className="ml-4 flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{alert.name}</h3>
              <span
                className={`ml-3 px-2 py-1 text-xs font-medium rounded ${
                  alertTypeColors[alert.alertType]
                }`}
              >
                {alertTypeLabels[alert.alertType]}
              </span>
            </div>

            {alert.description && (
              <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
            )}

            {projectName && (
              <p className="text-xs text-gray-500 mb-2">Project: {projectName}</p>
            )}

            {/* Notification Methods */}
            <div className="flex items-center space-x-4 mt-3">
              {alert.emailEnabled && (
                <div className="flex items-center text-xs text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span>
                    Email {alert.emailAddresses && `(${alert.emailAddresses.length})`}
                  </span>
                </div>
              )}
              {alert.webhookEnabled && (
                <div className="flex items-center text-xs text-gray-600">
                  <GlobeAltIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="capitalize">{alert.webhookType || 'Webhook'}</span>
                </div>
              )}
              <span className="text-xs text-gray-500">
                {alert.notificationFrequency.replace('_', ' ')}
              </span>
            </div>

            {/* Last Triggered */}
            {alert.lastTriggeredAt && (
              <p className="text-xs text-gray-500 mt-2">
                Last triggered: {new Date(alert.lastTriggeredAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Toggle Switch */}
          <button
            onClick={() => onToggle(alert)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              alert.enabled ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                alert.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          <button
            onClick={() => onEdit(alert)}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Edit Alert"
          >
            <PencilIcon className="h-5 w-5" />
          </button>

          <button
            onClick={() => onDelete(alert)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete Alert"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Conditions Preview */}
      {Object.keys(alert.conditions).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Conditions:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(alert.conditions).map(([key, value]) => (
              <span
                key={key}
                className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded"
              >
                {key}: {JSON.stringify(value)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertCard;
