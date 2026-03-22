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
        "flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl border border-destructive/20 bg-destructive/5",
        theme.classes?.root
      )}
    >
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
         <AlertCircle className="text-destructive" size={32} />
      </div>
      <h3 className="text-xl font-bold mb-2 text-foreground">
        {t('commentsError')}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {error?.message || "Wystąpił nieoczekiwany problem przy ładowaniu komentarzy."}
      </p>
      {reset && (
        <button
          onClick={reset}
          className="flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-xl font-bold active:scale-95 transition-all hover:opacity-90"
        >
          <RefreshCcw size={16} />
          Spróbuj ponownie
        </button>
      )}
    </div>
  );
};

export default ErrorState;
