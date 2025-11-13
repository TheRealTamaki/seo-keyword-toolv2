import React from 'react';
import { ClockIcon, EnvelopeIcon, GlobeAltIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export interface AlertHistoryItem {
  id: string;
  alertType: string;
  triggerData: Record<string, any>;
  emailSent: boolean;
  emailSentAt: string | null;
  webhookSent: boolean;
  webhookSentAt: string | null;
  webhookResponseCode: number | null;
  notificationErrors: any[];
  triggeredAt: string;
}

interface AlertHistoryProps {
  history: AlertHistoryItem[];
  loading?: boolean;
}

const AlertHistory: React.FC<AlertHistoryProps> = ({ history, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert History</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert History</h2>
        <div className="text-center py-8">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No alerts have been triggered yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Alert History ({history.length})
      </h2>

      <div className="space-y-3">
        {history.map((item) => {
          const hasErrors = item.notificationErrors && item.notificationErrors.length > 0;

          return (
            <div
              key={item.id}
              className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {item.alertType.replace('_', ' ')}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {new Date(item.triggeredAt).toLocaleString()}
                  </span>
                </div>

                {/* Trigger Data */}
                {Object.keys(item.triggerData).length > 0 && (
                  <div className="mb-2 text-sm text-gray-700">
                    {Object.entries(item.triggerData).map(([key, value]) => (
                      <span key={key} className="mr-3">
                        <strong>{key}:</strong> {JSON.stringify(value)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notification Status */}
                <div className="flex items-center space-x-4 text-xs">
                  {/* Email Status */}
                  <div className="flex items-center">
                    {item.emailSent ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-green-700">Email sent</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-gray-500">No email</span>
                      </>
                    )}
                  </div>

                  {/* Webhook Status */}
                  <div className="flex items-center">
                    {item.webhookSent ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-green-700">
                          Webhook {item.webhookResponseCode && `(${item.webhookResponseCode})`}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-gray-500">No webhook</span>
                      </>
                    )}
                  </div>

                  {/* Errors */}
                  {hasErrors && (
                    <span className="text-red-600 font-medium">
                      {item.notificationErrors.length} error(s)
                    </span>
                  )}
                </div>

                {/* Error Details */}
                {hasErrors && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    {item.notificationErrors.map((error: any, index: number) => (
                      <p key={index} className="text-xs text-red-700">
                        {error.type}: {error.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertHistory;
