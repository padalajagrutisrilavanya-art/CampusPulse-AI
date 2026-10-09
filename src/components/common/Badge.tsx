import React from 'react';
import { AcademicRiskLevel, PlacementRiskLevel } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'danger' | 'warning' | 'success' | 'info' | 'neutral' | 'provisional';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantClasses = {
    danger: 'bg-red-50 text-red-700 border border-red-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    provisional: 'bg-purple-50 text-purple-700 border border-purple-200',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md font-medium tracking-tight ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

export const AcademicRiskBadge: React.FC<{ level: AcademicRiskLevel; size?: 'sm' | 'md' }> = ({
  level,
  size = 'md',
}) => {
  if (level === 'High') {
    return <Badge variant="danger" size={size}>High Risk</Badge>;
  }
  if (level === 'Medium') {
    return <Badge variant="warning" size={size}>Medium Risk</Badge>;
  }
  if (level === 'Low') {
    return <Badge variant="success" size={size}>Low Risk</Badge>;
  }
  return <Badge variant="neutral" size={size}>Insufficient Data</Badge>;
};

export const PlacementRiskBadge: React.FC<{ level: PlacementRiskLevel; size?: 'sm' | 'md' }> = ({
  level,
  size = 'md',
}) => {
  if (level === 'High') {
    return <Badge variant="danger" size={size}>Low Readiness (High Risk)</Badge>;
  }
  if (level === 'Medium') {
    return <Badge variant="warning" size={size}>Moderate Readiness</Badge>;
  }
  if (level === 'Low') {
    return <Badge variant="success" size={size}>Placement Ready</Badge>;
  }
  return <Badge variant="neutral" size={size}>Not Evaluated</Badge>;
};

export const StatusBadge: React.FC<{ status: 'Pending' | 'In Progress' | 'Completed'; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  if (status === 'Completed') return <Badge variant="success" size={size}>Completed</Badge>;
  if (status === 'In Progress') return <Badge variant="info" size={size}>In Progress</Badge>;
  return <Badge variant="warning" size={size}>Pending</Badge>;
};
