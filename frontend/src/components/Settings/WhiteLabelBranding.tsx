import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BuildingOfficeIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface BrandingSettings {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  websiteUrl: string;
}

const WhiteLabelBranding: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [branding, setBranding] = useState<BrandingSettings>({
    companyName: '',
    logoUrl: '',
    primaryColor: '#6366f1',
    websiteUrl: '',
  });

  useEffect(() => {
    // In a real implementation, fetch branding settings from backend
    // For now, load from localStorage
    const saved = localStorage.getItem('brandingSettings');
    if (saved) {
      try {
        setBranding(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading branding settings:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      // In a real implementation, save to backend
      // For now, save to localStorage
      localStorage.setItem('brandingSettings', JSON.stringify(branding));

      toast.success('Branding settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving branding settings:', error);
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm('Reset all branding settings to default?')) {
      return;
    }

    const defaultBranding: BrandingSettings = {
      companyName: '',
      logoUrl: '',
      primaryColor: '#6366f1',
      websiteUrl: '',
    };

    setBranding(defaultBranding);
    localStorage.setItem('brandingSettings', JSON.stringify(defaultBranding));
    toast.success('Branding settings reset to default');
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
          <BuildingOfficeIcon className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">White-Label Reports</h3>
            <p className="mt-1 text-sm text-blue-700">
              Customize the branding on your generated reports. Perfect for agencies presenting
              reports to clients.
            </p>
          </div>
        </div>
      </div>

      {/* Branding Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Branding Configuration</h3>

        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            type="text"
            id="companyName"
            value={branding.companyName}
            onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
            placeholder="Your Company Name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            This will appear in the report header and footer
          </p>
        </div>

        {/* Logo URL */}
        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
            Logo URL
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="url"
              id="logoUrl"
              value={branding.logoUrl}
              onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Direct link to your company logo (PNG, SVG, or JPG recommended)
          </p>

          {/* Logo Preview */}
          {branding.logoUrl && (
            <div className="mt-3 flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <PhotoIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Preview:</span>
              <img
                src={branding.logoUrl}
                alt="Logo preview"
                className="h-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  toast.error('Could not load logo image');
                }}
              />
            </div>
          )}
        </div>

        {/* Primary Color */}
        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
            Primary Color
          </label>
          <div className="mt-1 flex gap-3 items-center">
            <input
              type="color"
              id="primaryColor"
              value={branding.primaryColor}
              onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={branding.primaryColor}
              onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
              placeholder="#6366f1"
              className="flex-1 block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono text-sm"
            />
            <div
              className="h-10 w-24 rounded border border-gray-200"
              style={{ backgroundColor: branding.primaryColor }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            This color will be used for report headers and accents
          </p>
        </div>

        {/* Website URL */}
        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700">
            Website URL
          </label>
          <input
            type="url"
            id="websiteUrl"
            value={branding.websiteUrl}
            onChange={(e) => setBranding({ ...branding, websiteUrl: e.target.value })}
            placeholder="https://yourcompany.com"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Link to your company website (appears in report footer)
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </div>

      {/* Preview Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Header Preview</h3>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8"
          style={{
            borderTopColor: branding.primaryColor,
            borderTopWidth: '4px',
            borderTopStyle: 'solid',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt="Company logo"
                  className="h-12 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: branding.primaryColor }}
                >
                  {branding.companyName || 'Your Company Name'}
                </h2>
                {branding.websiteUrl && (
                  <p className="text-sm text-gray-600">{branding.websiteUrl}</p>
                )}
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>SEO Report</p>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelBranding;
