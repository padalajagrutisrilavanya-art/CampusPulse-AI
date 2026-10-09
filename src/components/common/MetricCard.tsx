import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trendText?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  accentColor?: 'blue' | 'teal' | 'red' | 'amber' | 'emerald' | 'purple';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trendText,
  trendType = 'neutral',
  accentColor = 'blue',
  onClick,
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }[accentColor];

  const trendColor = {
    positive: 'text-emerald-700 bg-emerald-50',
    negative: 'text-red-700 bg-red-50',
    neutral: 'text-slate-600 bg-slate-100',
  }[trendType];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
            {trendText && (
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${trendColor}`}>
                {trendText}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg border ${colorMap}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
