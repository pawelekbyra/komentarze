"use client";

import React from 'react';
import { useTranslation, useCommentsContext } from '../context/CommentsContext';
import { cn } from '@/lib/utils';

const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useCommentsContext();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center rounded-3xl",
        theme.fontSerif
      )}
      style={{ backgroundColor: theme.colors?.background }}
    >
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
         <span className="text-2xl text-primary font-bold">💬</span>
      </div>
      <h3
        className="text-xl font-bold mb-2"
        style={{ color: theme.colors?.text }}
      >
        {t('noCommentsYet')}
      </h3>
      <p
        className="text-sm opacity-60"
        style={{ color: theme.colors?.text }}
      >
        {t('beFirst')}
      </p>
    </div>
  );
};

export default EmptyState;
