import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  // In a real implementation, you would have update profile functionality
  // For now, this is a read-only view since Supabase handles user management

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
              <UserCircleIcon className="h-12 w-12 text-primary-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your account is managed through Supabase authentication
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <div className="mt-1">
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Email address cannot be changed from this interface
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">User ID</label>
            <div className="mt-1">
              <input
                type="text"
                value={user?.id || ''}
                disabled
                className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500 cursor-not-allowed font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Account Created</label>
            <div className="mt-1">
              <input
                type="text"
                value={
                  user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'
                }
                disabled
                className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">Account Actions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account security and preferences
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-500">Change your account password</p>
            </div>
            <button
              onClick={() => toast('Password reset functionality coming soon', { icon: 'ℹ️' })}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <button
              onClick={() => toast('2FA setup coming soon', { icon: 'ℹ️' })}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Enable 2FA
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Email Verification</p>
              <p className="text-sm text-gray-500">Verify your email address</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">Usage Statistics</h3>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your account usage
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Projects</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">-</dd>
          </div>

          <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Keywords Tracked</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">-</dd>
          </div>

          <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5">
            <dt className="text-sm font-medium text-gray-500 truncate">API Calls (30d)</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">-</dd>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border-2 border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
        <p className="mt-1 text-sm text-red-600">
          Irreversible actions that affect your account
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-red-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Export All Data</p>
              <p className="text-sm text-gray-500">
                Download all your data in CSV format
              </p>
            </div>
            <button
              onClick={() => toast('Data export functionality coming soon', { icon: 'ℹ️' })}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Export Data
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-red-900">Delete Account</p>
              <p className="text-sm text-red-600">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Are you sure you want to delete your account? This action cannot be undone.'
                  )
                ) {
                  toast.error('Account deletion is not yet implemented');
                }
              }}
              className="px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
