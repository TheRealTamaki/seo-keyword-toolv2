import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiKeysService } from '../../services/api';
import {
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

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
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [provider, setProvider] = useState('dataforseo');
  const [apiKey, setApiKey] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeysService.get();
      setApiKeys(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load API keys');
      }
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    try {
      setValidating(true);
      const response = await apiKeysService.validate({
        provider,
        apiKey: apiKey.trim(),
        apiPassword: apiPassword.trim() || undefined,
      });

      if (response.data.success) {
        toast.success('API key is valid!');
        const accountInfo = response.data.data;
        if (accountInfo.balance !== undefined) {
          toast.success(`Account balance: $${accountInfo.balance.toFixed(2)}`);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'API key validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    try {
      setSaving(true);
      const response = await apiKeysService.create({
        provider,
        apiKey: apiKey.trim(),
        apiPassword: apiPassword.trim() || undefined,
      });

      if (response.data.success) {
        toast.success('API key saved successfully!');
        setShowAddForm(false);
        setApiKey('');
        setApiPassword('');
        fetchApiKeys();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      await apiKeysService.delete(id);
      toast.success('API key deleted successfully');
      fetchApiKeys();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete API key');
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
                  onClick={() => handleDelete(key.id)}
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
      {!showAddForm && apiKeys.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your DataForSEO API key</p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <KeyIcon className="-ml-1 mr-2 h-5 w-5" />
              Add API Key
            </button>
          </div>
        </div>
      )}

      {!showAddForm && apiKeys.length > 0 && (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <KeyIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Another API Key
        </button>
      )}

      {/* Add API Key Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Add New API Key</h3>

          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
              Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="dataforseo">DataForSEO</option>
            </select>
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              API Login (Username)
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="your-login@email.com"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="apiPassword" className="block text-sm font-medium text-gray-700">
              API Password
            </label>
            <div className="mt-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="apiPassword"
                value={apiPassword}
                onChange={(e) => setApiPassword(e.target.value)}
                placeholder="your-api-password"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              onClick={handleValidate}
              disabled={validating || !apiKey.trim()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                  Validating...
                </>
              ) : (
                'Test Connection'
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save API Key'
              )}
            </button>

            <button
              onClick={() => {
                setShowAddForm(false);
                setApiKey('');
                setApiPassword('');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagement;
