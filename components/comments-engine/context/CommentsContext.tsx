"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { pl } from 'date-fns/locale';
import { CommentAdapter, UserProfile, CommentsTranslations, CommentsTheme } from '../shared/types';

interface CommentsContextType {
  adapter: CommentAdapter;
  userProfile: UserProfile | null;
  translations: CommentsTranslations;
  theme: CommentsTheme;
  slideId: string;
  onAuthRequired?: () => void;
  onAvatarClick?: (userId: string) => void;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'locked') => void;
}

const defaultTranslations: CommentsTranslations = {
  commentsTitle: 'Komentarze ({{count}})',
  addCommentPlaceholder: 'Dodaj komentarz...',
  replyTo: 'Odpowiedz użytkownikowi {{user}}...',
  reply: 'Odpowiedz',
  replyingTo: 'Odpowiadasz użytkownikowi {{user}}',
  top: 'Najlepsze',
  newest: 'Najnowsze',
  loadMore: 'Pokaż więcej',
  noCommentsYet: 'Brak komentarzy. Bądź pierwszy!',
  commentsError: 'Błąd podczas ładowania komentarzy.',
  commentPostError: 'Błąd podczas dodawania komentarza.',
  delete: 'Usuń',
  report: 'Zgłoś',
  deleteConfirmation: 'Czy na pewno chcesz usunąć ten komentarz?',
  reportSubmitted: 'Zgłoszenie zostało wysłane.',
  loginRequired: 'Musisz się zalogować, aby wykonać tę akcję.',
  viewReplies: 'Zobacz odpowiedzi ({{count}})',
  hideReplies: 'Ukryj odpowiedzi',
  imageTooLarge: 'Obraz jest zbyt duży (max 2MB).',
  yourAvatar: 'Twój awatar',
  beFirst: 'Bądź pierwszym, który skomentuje',
};

const defaultTheme: CommentsTheme = {
  locale: pl,
  fontSerif: 'font-serif',
  colors: {
    text: '#1a1a1a',
    background: '#FDFBF7',
    primary: '#7c3aed',
    muted: '#A6A6A6',
  },
};

const CommentsContext = createContext<CommentsContextType | null>(null);

export const CommentsProvider: React.FC<{
  children: React.ReactNode;
  adapter: CommentAdapter;
  slideId: string;
  userProfile?: UserProfile | null;
  translations?: Partial<CommentsTranslations>;
  theme?: Partial<CommentsTheme>;
  onAuthRequired?: () => void;
  onAvatarClick?: (userId: string) => void;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'locked') => void;
}> = ({
  children,
  adapter,
  slideId,
  userProfile = null,
  translations = {},
  theme = {},
  onAuthRequired,
  onAvatarClick,
  addToast,
}) => {
  const mergedTranslations = useMemo<CommentsTranslations>(() => ({ ...defaultTranslations, ...translations }), [translations]);
  const mergedTheme = useMemo<CommentsTheme>(() => ({
    ...defaultTheme,
    ...theme,
    colors: { ...defaultTheme.colors, ...theme.colors },
    classes: { ...defaultTheme.classes, ...theme.classes },
  }), [theme]);

  const value: CommentsContextType = {
    adapter,
    slideId,
    userProfile,
    translations: mergedTranslations,
    theme: mergedTheme,
    onAuthRequired,
    onAvatarClick,
    addToast,
  };

  return <CommentsContext.Provider value={value}>{children}</CommentsContext.Provider>;
};

export const useCommentsContext = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useCommentsContext must be used within a CommentsProvider');
  }
  return context;
};

export const useTranslation = () => {
  const { translations } = useCommentsContext();

  const t = (key: keyof CommentsTranslations, params?: Record<string, string>) => {
    let text = translations[key] || (key as string);
    if (params) {
      Object.keys(params).forEach((param) => {
        text = text.replace(`{{${param}}}`, params[param]);
      });
    }
    return text;
  };

  return { t };
};
