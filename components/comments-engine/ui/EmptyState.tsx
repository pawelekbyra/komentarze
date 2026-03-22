"use client";

import React from 'react';
import { useTranslation, useCommentsContext } from '../context/CommentsContext';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useCommentsContext();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl border-2 border-dashed border-muted",
        theme.classes?.root
      )}
    >
      <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
         <MessageSquare className="text-muted-foreground w-10 h-10" />
      </div>
      <h3 className="text-xl font-bold mb-2 text-foreground">
        {t('noCommentsYet')}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('beFirst')}
      </p>
    </div>
  );
};

export default EmptyState;
