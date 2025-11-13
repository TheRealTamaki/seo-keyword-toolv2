import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiKeysService } from '../../services/api';
import {
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import AddApiKeyModal from './AddApiKeyModal';
import DeleteApiKeyDialog from './DeleteApiKeyDialog';

interface ApiKey {
  id: string;
  provider: string;
  isValid: boolean;
  accountInfo?: {
    balance: number;
    tasksCompleted: number;
  };
  createdAt: string;
}

const ApiKeyManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeysService.get();
      // Backend returns single API key info, not an array
      const keyData = response.data.data;
      if (keyData) {
        setApiKeys([{
          id: keyData.id,
          provider: keyData.provider,
          isValid: keyData.isValidated,
          createdAt: keyData.createdAt,
        }]);

        // Try to fetch account info if key is validated
        if (keyData.isValidated) {
          try {
            const accountResponse = await apiKeysService.getAccountInfo();
            if (accountResponse.data.success && accountResponse.data.data) {
              setApiKeys([{
                id: keyData.id,
                provider: keyData.provider,
                isValid: keyData.isValidated,
                accountInfo: {
                  balance: accountResponse.data.data.balance || 0,
                  tasksCompleted: 0,
                },
                createdAt: keyData.createdAt,
              }]);
            }
          } catch (err) {
            // Ignore account info errors
            console.log('Could not fetch account info:', err);
          }
        }
      } else {
        setApiKeys([]);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load API keys');
      }
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async (apiKey: string, apiPassword: string) => {
    try {
      await apiKeysService.create({
        apiKey: `${apiKey}:${apiPassword}`,
        skipValidation: false,
      });
      toast.success('API key saved successfully!');
      fetchApiKeys();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to save API key');
      throw error;
    }
  };

  const handleDeleteApiKey = async () => {
    try {
      await apiKeysService.delete();
      toast.success('API key deleted successfully');
      fetchApiKeys();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to delete API key');
      throw error;
    }
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
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              Bring Your Own API Key (BYOK)
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              This tool uses the DataForSEO API. You need to provide your own API credentials.
              Don't have an account?{' '}
              <a
                href="https://dataforseo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:text-blue-900"
              >
                Sign up at DataForSEO
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Existing API Keys */}
      {apiKeys.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Your API Keys</h3>
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <KeyIcon className="h-6 w-6 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {key.provider === 'dataforseo' ? 'DataForSEO' : key.provider}
                      </p>
                      {key.isValid ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Invalid
                        </span>
                      )}
                    </div>
                    {key.accountInfo && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Balance: ${key.accountInfo.balance.toFixed(2)}</p>
                        <p>Tasks Completed: {key.accountInfo.tasksCompleted.toLocaleString()}</p>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Added {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New API Key */}
      {apiKeys.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your DataForSEO API key</p>
          <div className="mt-6">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <KeyIcon className="-ml-1 mr-2 h-5 w-5" />
              Add API Key
            </button>
          </div>
        </div>
      )}

      {apiKeys.length > 0 && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <KeyIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Another API Key
        </button>
      )}

      {/* Modals */}
      <AddApiKeyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddApiKey}
      />

      <DeleteApiKeyDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteApiKey}
      />
    </div>
  );
};

export default ApiKeyManagement;
