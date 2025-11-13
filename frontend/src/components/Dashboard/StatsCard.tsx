import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import Sparkline, { SparklineData } from '../Charts/Sparkline';

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
  sparklineData?: SparklineData[];
  sparklineColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  name,
  value,
  icon: Icon,
  href,
  color = 'bg-primary-500',
  change,
  sparklineData,
  sparklineColor,
}) => {
  const CardContent = () => (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{name}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg flex-shrink-0`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Change indicator or sparkline */}
      {change && !sparklineData && (
        <div className="flex items-center">
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

      {/* Sparkline chart */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-2">
          <Sparkline
            data={sparklineData}
            color={sparklineColor}
            height={40}
            className="w-full"
          />
          {change && (
            <div className="flex items-center mt-1">
              {change.value > 0 ? (
                <ArrowUpIcon className="h-3 w-3 text-green-600 mr-1" />
              ) : change.value < 0 ? (
                <ArrowDownIcon className="h-3 w-3 text-red-600 mr-1" />
              ) : null}
              <span
                className={`text-xs font-medium ${
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
      )}
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
