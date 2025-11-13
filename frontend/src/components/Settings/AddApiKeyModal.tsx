import React, { useState } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface AddApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string, apiPassword: string) => Promise<void>;
}

const AddApiKeyModal: React.FC<AddApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [provider, setProvider] = useState('dataforseo');
  const [apiKey, setApiKey] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleValidate = async () => {
    if (!apiKey.trim() || !apiPassword.trim()) {
      return;
    }

    try {
      setValidating(true);
      await onSubmit(apiKey, apiPassword);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !apiPassword.trim()) {
      return;
    }

    try {
      setSaving(true);
      await onSubmit(apiKey, apiPassword);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setApiKey('');
    setApiPassword('');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add API Key</h3>
              <button
                onClick={handleClose}
                disabled={validating || saving}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
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
                  API Login (Username) <span className="text-red-500">*</span>
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
                  API Password <span className="text-red-500">*</span>
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  You can find your API credentials in your{' '}
                  <a
                    href="https://app.dataforseo.com/api-dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline hover:text-blue-900"
                  >
                    DataForSEO Dashboard
                  </a>
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleClose}
                  disabled={validating || saving}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleValidate}
                  disabled={validating || saving || !apiKey.trim() || !apiPassword.trim()}
                  className="flex-1 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                  {validating ? 'Testing...' : 'Test & Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddApiKeyModal;
