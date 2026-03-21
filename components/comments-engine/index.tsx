"use client";

import React from 'react';
import { CommentsProvider } from './context/CommentsContext';
import CommentList from './ui/CommentList';
import { CommentAdapter, UserProfile, CommentsTranslations, CommentsTheme } from './shared/types';

interface CommentsEngineProps {
  adapter: CommentAdapter;
  slideId: string;
  userProfile?: UserProfile | null;
  translations?: Partial<CommentsTranslations>;
  theme?: Partial<CommentsTheme>;
  sortBy?: 'newest' | 'top';
  onAuthRequired?: () => void;
  onAvatarClick?: (userId: string) => void;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'locked') => void;
}

const CommentsEngine: React.FC<CommentsEngineProps> = ({
  adapter,
  slideId,
  userProfile,
  translations,
  theme,
  sortBy = 'top',
  onAuthRequired,
  onAvatarClick,
  addToast,
}) => {
  return (
    <CommentsProvider
      adapter={adapter}
      slideId={slideId}
      userProfile={userProfile}
      translations={translations}
      theme={theme}
      onAuthRequired={onAuthRequired}
      onAvatarClick={onAvatarClick}
      addToast={addToast}
    >
      <CommentList sortBy={sortBy} />
    </CommentsProvider>
  );
};

export default CommentsEngine;

// Export types for consumers
export type { CommentAdapter, UserProfile, CommentsTranslations, CommentsTheme } from './shared/types';
export type { Comment } from './shared/validators';
