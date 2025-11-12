import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { keywordsService } from '../../services/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Keyword {
  id: string;
  keyword: string;
  searchEngine: string;
  device: string;
  location: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
}

interface EditKeywordModalProps {
  keyword: Keyword;
  onClose: () => void;
  onSuccess: () => void;
}

const EditKeywordModal: React.FC<EditKeywordModalProps> = ({ keyword, onClose, onSuccess }) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    keyword: keyword.keyword,
    searchEngine: keyword.searchEngine,
    device: keyword.device,
    location: keyword.location,
    searchVolume: keyword.searchVolume?.toString() || '',
    difficulty: keyword.difficulty?.toString() || '',
    cpc: keyword.cpc?.toString() || '',
    intent: keyword.intent || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.keyword.trim()) {
      toast.error('Please enter a keyword');
      return;
    }

    try {
      setSaving(true);
      const updateData: any = {
        keyword: formData.keyword.trim(),
        searchEngine: formData.searchEngine,
        device: formData.device,
        location: formData.location,
      };

      // Add optional numeric fields if provided
      if (formData.searchVolume) {
        updateData.searchVolume = parseInt(formData.searchVolume);
      }
      if (formData.difficulty) {
        updateData.difficulty = parseInt(formData.difficulty);
      }
      if (formData.cpc) {
        updateData.cpc = parseFloat(formData.cpc);
      }
      if (formData.intent) {
        updateData.intent = formData.intent;
      }

      const response = await keywordsService.update(keyword.id, updateData);

      if (response.data.success) {
        toast.success('Keyword updated successfully!');
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update keyword');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Edit Keyword
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="keyword" className="block text-sm font-medium text-gray-700">
                  Keyword
                </label>
                <input
                  type="text"
                  id="keyword"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  placeholder="e.g., best running shoes"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="searchEngine"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Search Engine
                  </label>
                  <select
                    id="searchEngine"
                    value={formData.searchEngine}
                    onChange={(e) => setFormData({ ...formData, searchEngine: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="google">Google</option>
                    <option value="bing">Bing</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="device" className="block text-sm font-medium text-gray-700">
                    Device
                  </label>
                  <select
                    id="device"
                    value={formData.device}
                    onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., United States, New York, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Optional Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="searchVolume"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Search Volume
                    </label>
                    <input
                      type="number"
                      id="searchVolume"
                      value={formData.searchVolume}
                      onChange={(e) =>
                        setFormData({ ...formData, searchVolume: e.target.value })
                      }
                      placeholder="e.g., 1000"
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                      Difficulty (0-100)
                    </label>
                    <input
                      type="number"
                      id="difficulty"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      placeholder="e.g., 45"
                      min="0"
                      max="100"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="cpc" className="block text-sm font-medium text-gray-700">
                      CPC ($)
                    </label>
                    <input
                      type="number"
                      id="cpc"
                      value={formData.cpc}
                      onChange={(e) => setFormData({ ...formData, cpc: e.target.value })}
                      placeholder="e.g., 2.50"
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="intent" className="block text-sm font-medium text-gray-700">
                      Search Intent
                    </label>
                    <select
                      id="intent"
                      value={formData.intent}
                      onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">Not specified</option>
                      <option value="informational">Informational</option>
                      <option value="commercial">Commercial</option>
                      <option value="transactional">Transactional</option>
                      <option value="navigational">Navigational</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Keyword'
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditKeywordModal;
