import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import classNames from 'classnames';
import DashboardLayout from '../components/Layout/DashboardLayout';
import ApiKeyManagement from '../components/Settings/ApiKeyManagement';
import NotificationPreferences from '../components/Settings/NotificationPreferences';
import UserProfile from '../components/Settings/UserProfile';
import {
  KeyIcon,
  BellIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const tabs = [
    {
      name: 'API Keys',
      icon: KeyIcon,
      component: ApiKeyManagement,
      description: 'Manage your DataForSEO API credentials',
    },
    {
      name: 'Notifications',
      icon: BellIcon,
      component: NotificationPreferences,
      description: 'Configure alert and notification preferences',
    },
    {
      name: 'Profile',
      icon: UserCircleIcon,
      component: UserProfile,
      description: 'Update your account information',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <Tab.Group>
            <Tab.List className="flex space-x-1 border-b border-gray-200 px-6">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'flex items-center px-4 py-4 text-sm font-medium border-b-2 -mb-px focus:outline-none transition-colors',
                      selected
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <tab.icon
                        className={classNames(
                          'mr-2 h-5 w-5',
                          selected ? 'text-primary-600' : 'text-gray-400'
                        )}
                      />
                      {tab.name}
                    </>
                  )}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels className="p-6">
              {tabs.map((tab, idx) => (
                <Tab.Panel key={idx} className="focus:outline-none">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">{tab.description}</p>
                  </div>
                  <tab.component />
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
