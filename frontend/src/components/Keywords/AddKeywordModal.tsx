import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { keywordsService } from '../../services/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AddKeywordModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddKeywordModal: React.FC<AddKeywordModalProps> = ({ projectId, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [saving, setSaving] = useState(false);

  // Single keyword fields
  const [keyword, setKeyword] = useState('');
  const [searchEngine, setSearchEngine] = useState('google');
  const [device, setDevice] = useState('desktop');
  const [location, setLocation] = useState('United States');

  // Bulk keywords
  const [bulkKeywords, setBulkKeywords] = useState('');

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyword.trim()) {
      toast.error('Please enter a keyword');
      return;
    }

    try {
      setSaving(true);
      const response = await keywordsService.create({
        projectId,
        keyword: keyword.trim(),
        searchEngine,
        device,
        location,
      });

      if (response.data.success) {
        toast.success('Keyword added successfully!');
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add keyword');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitBulk = async (e: React.FormEvent) => {
    e.preventDefault();

    const lines = bulkKeywords
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      toast.error('Please enter at least one keyword');
      return;
    }

    if (lines.length > 100) {
      toast.error('Maximum 100 keywords allowed per import');
      return;
    }

    try {
      setSaving(true);
      const keywordsData = lines.map((kw) => ({
        projectId,
        keyword: kw,
        searchEngine,
        device,
        location,
      }));

      const response = await keywordsService.bulkCreate(keywordsData);

      if (response.data.success) {
        toast.success(`${lines.length} keywords added successfully!`);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add keywords');
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
              Add Keywords
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-4">
              <button
                onClick={() => setMode('single')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  mode === 'single'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Single Keyword
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  mode === 'bulk'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Bulk Import
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={mode === 'single' ? handleSubmitSingle : handleSubmitBulk}>
            <div className="px-6 py-4 space-y-4">
              {mode === 'single' ? (
                <>
                  <div>
                    <label htmlFor="keyword" className="block text-sm font-medium text-gray-700">
                      Keyword
                    </label>
                    <input
                      type="text"
                      id="keyword"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="e.g., best running shoes"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="bulkKeywords"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Keywords (one per line)
                    </label>
                    <textarea
                      id="bulkKeywords"
                      value={bulkKeywords}
                      onChange={(e) => setBulkKeywords(e.target.value)}
                      placeholder="Enter keywords, one per line&#10;e.g.,&#10;best running shoes&#10;top rated sneakers&#10;affordable athletic footwear"
                      rows={10}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono text-sm"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Maximum 100 keywords per import</p>
                  </div>
                </>
              )}

              {/* Common fields */}
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
                    value={searchEngine}
                    onChange={(e) => setSearchEngine(e.target.value)}
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
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
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
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., United States, New York, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a country, state, or city for location-specific results
                </p>
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
                    Adding...
                  </>
                ) : mode === 'single' ? (
                  'Add Keyword'
                ) : (
                  'Add Keywords'
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddKeywordModal;
