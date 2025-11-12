import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { keywordListsService, projectsService } from '../../services/api';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ResearchKeyword {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
  isQuestion?: boolean;
  questionType?: string;
  opportunityScore?: number;
  wordCount?: number;
}

interface KeywordList {
  id: string;
  name: string;
  description?: string;
  keywordCount: number;
}

interface Project {
  id: string;
  name: string;
  domain: string;
}

interface SaveToListModalProps {
  keywords: ResearchKeyword[];
  onClose: () => void;
  onSuccess: () => void;
}

const SaveToListModal: React.FC<SaveToListModalProps> = ({ keywords, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [lists, setLists] = useState<KeywordList[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedList, setSelectedList] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListProject, setNewListProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLists();
    fetchProjects();
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await keywordListsService.getAll();
      setLists(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load keyword lists');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectsService.getAll();
      setProjects(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleSave = async () => {
    let targetListId = selectedList;

    // Create new list if needed
    if (mode === 'new') {
      if (!newListName.trim()) {
        toast.error('Please enter a list name');
        return;
      }

      try {
        setSaving(true);
        const response = await keywordListsService.create({
          name: newListName.trim(),
          description: newListDescription.trim() || undefined,
          projectId: newListProject || undefined,
        });

        if (response.data.success) {
          targetListId = response.data.data.id;
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to create list');
        setSaving(false);
        return;
      }
    }

    // Validate target list
    if (!targetListId) {
      toast.error('Please select or create a list');
      setSaving(false);
      return;
    }

    // Add keywords to list
    try {
      const keywordsData = keywords.map((k) => ({
        keyword: k.keyword,
        searchVolume: k.searchVolume,
        difficulty: k.difficulty,
        cpc: k.cpc,
        intent: k.intent,
        isQuestion: k.isQuestion,
        questionType: k.questionType,
        opportunityScore: k.opportunityScore,
        wordCount: k.wordCount,
      }));

      const response = await keywordListsService.addKeywords(targetListId, {
        keywords: keywordsData,
      });

      if (response.data.success) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save keywords');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Save Keywords to List
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-900">
                Saving {keywords.length} keyword{keywords.length !== 1 ? 's' : ''} to a list
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setMode('existing')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                  mode === 'existing'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Existing List
              </button>
              <button
                onClick={() => setMode('new')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                  mode === 'new'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <PlusIcon className="h-4 w-4 inline mr-1" />
                New List
              </button>
            </div>

            {/* Existing List Mode */}
            {mode === 'existing' && (
              <div>
                <label htmlFor="list" className="block text-sm font-medium text-gray-700 mb-2">
                  Select List
                </label>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : lists.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500">No keyword lists found</p>
                    <button
                      onClick={() => setMode('new')}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      Create a new list
                    </button>
                  </div>
                ) : (
                  <select
                    id="list"
                    value={selectedList}
                    onChange={(e) => setSelectedList(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Select a list...</option>
                    {lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.keywordCount || 0} keywords)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* New List Mode */}
            {mode === 'new' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="listName" className="block text-sm font-medium text-gray-700 mb-1">
                    List Name
                  </label>
                  <input
                    type="text"
                    id="listName"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., High Opportunity Keywords"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="listDescription"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="listDescription"
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="What is this list for?"
                    rows={2}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="listProject" className="block text-sm font-medium text-gray-700 mb-1">
                    Project (Optional)
                  </label>
                  <select
                    id="listProject"
                    value={newListProject}
                    onChange={(e) => setNewListProject(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">No project (global list)</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.domain})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3 rounded-b-lg">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save to List'
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default SaveToListModal;
