"use client";

import React from 'react';
import { useTranslation, useCommentsContext } from '../context/CommentsContext';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorStateProps {
  error?: any;
  reset?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, reset }) => {
  const { t } = useTranslation();
  const { theme } = useCommentsContext();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center rounded-3xl border border-red-100",
        theme.fontSerif
      )}
      style={{ backgroundColor: theme.colors?.background }}
    >
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
         <AlertCircle className="text-red-500" size={32} />
      </div>
      <h3
        className="text-xl font-bold mb-2 text-red-600"
      >
        {t('commentsError')}
      </h3>
      {reset && (
        <button
          onClick={reset}
          className="mt-4 flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl font-bold active:scale-95 transition-all"
        >
          <RefreshCcw size={16} />
          Spróbuj ponownie
        </button>
      )}
    </div>
  );
};

export default ErrorState;
