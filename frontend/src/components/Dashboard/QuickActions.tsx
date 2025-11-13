import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface QuickAction {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    name: 'Create Project',
    description: 'Start a new SEO project',
    href: '/projects',
    icon: FolderIcon,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    name: 'Add Keywords',
    description: 'Track new keywords',
    href: '/keywords',
    icon: PlusIcon,
    color: 'text-green-600 bg-green-50',
  },
  {
    name: 'Research Keywords',
    description: 'Discover new opportunities',
    href: '/research',
    icon: SparklesIcon,
    color: 'text-purple-600 bg-purple-50',
  },
  {
    name: 'Check Rankings',
    description: 'View keyword positions',
    href: '/rankings',
    icon: ChartBarIcon,
    color: 'text-yellow-600 bg-yellow-50',
  },
  {
    name: 'Analyze Competitors',
    description: 'Compare with rivals',
    href: '/competitors',
    icon: MagnifyingGlassIcon,
    color: 'text-orange-600 bg-orange-50',
  },
  {
    name: 'View Reports',
    description: 'Export and analyze data',
    href: '/reports',
    icon: DocumentTextIcon,
    color: 'text-indigo-600 bg-indigo-50',
  },
];

const QuickActions: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            to={action.href}
            className="group relative p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start">
              <div className={`${action.color} p-2 rounded-lg`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {action.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
