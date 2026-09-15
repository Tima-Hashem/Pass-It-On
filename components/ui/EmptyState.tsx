import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="text-slate-500 mt-2 max-w-sm">{description}</p>
    </div>
  );
}
