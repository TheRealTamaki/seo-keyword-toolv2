import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface StatsCardProps {
  name: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  color?: string;
  change?: {
    value: number;
    label: string;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  name,
  value,
  icon: Icon,
  href,
  color = 'bg-primary-500',
  change,
}) => {
  const CardContent = () => (
    <>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{name}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="mt-2 flex items-center">
              {change.value > 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-green-600 mr-1" />
              ) : change.value < 0 ? (
                <ArrowDownIcon className="h-4 w-4 text-red-600 mr-1" />
              ) : null}
              <span
                className={`text-sm font-medium ${
                  change.value > 0
                    ? 'text-green-600'
                    : change.value < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {Math.abs(change.value)}% {change.label}
              </span>
            </div>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg flex-shrink-0`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
      >
        <CardContent />
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <CardContent />
    </div>
  );
};

export default StatsCard;
