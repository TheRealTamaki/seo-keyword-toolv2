import React from 'react';
import { format } from 'date-fns';
import {
  SparklesIcon,
  QuestionMarkCircleIcon,
  PhotoIcon,
  VideoCameraIcon,
  MapPinIcon,
  BookOpenIcon,
  ShoppingBagIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

interface SerpFeature {
  feature: string;
  appearsIn: boolean;
  checkedAt: string;
}

interface SerpFeaturesProps {
  features: SerpFeature[];
}

const SerpFeatures: React.FC<SerpFeaturesProps> = ({ features }) => {
  const getFeatureIcon = (feature: string) => {
    const name = feature.toLowerCase();
    if (name.includes('snippet')) return SparklesIcon;
    if (name.includes('people') || name.includes('ask')) return QuestionMarkCircleIcon;
    if (name.includes('image')) return PhotoIcon;
    if (name.includes('video')) return VideoCameraIcon;
    if (name.includes('local') || name.includes('map')) return MapPinIcon;
    if (name.includes('knowledge')) return BookOpenIcon;
    if (name.includes('shopping')) return ShoppingBagIcon;
    return LinkIcon;
  };

  const getFeatureColor = (appearsIn: boolean) => {
    return appearsIn
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-500 border-gray-200';
  };

  const formatFeatureName = (feature: string) => {
    // Convert snake_case to Title Case
    return feature
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">SERP Features</h3>
          <p className="text-sm text-gray-500 mt-1">Features where your site appears</p>
        </div>
      </div>

      {features.length === 0 ? (
        <div className="text-center py-8">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No SERP features detected</p>
        </div>
      ) : (
        <div className="space-y-2">
          {features.map((feature, index) => {
            const Icon = getFeatureIcon(feature.feature);
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${getFeatureColor(
                  feature.appearsIn
                )}`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">{formatFeatureName(feature.feature)}</p>
                    <p className="text-xs opacity-75">
                      {format(new Date(feature.checkedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {feature.appearsIn && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-900">
                    Present
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SerpFeatures;
