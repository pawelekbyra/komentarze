"use client";

import React from 'react';
import EmbeddedComments from './EmbeddedComments';
import CommentsModal from './CommentsModal';
import { CommentWithRelations } from '@/lib/dto';
import { fetchComments as defaultFetchComments } from '@/lib/queries';

interface CommentsModuleProps {
  mode: 'embedded' | 'modal';
  slideId: string;
  userProfile?: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
    role: string;
  } | null;
  initialCommentsCount?: number;
  // Modal specific
  isOpen?: boolean;
  onClose?: () => void;
  // Customization
  lang?: string;
  translations?: Record<string, string>;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'locked') => void;
  onOpenLogin?: () => void;
  onAvatarClick?: (userId: string) => void;
  // API Overrides
  api?: {
    fetchComments?: (params: { pageParam?: string; slideId: string; sortBy?: 'newest' | 'top' }) => Promise<{ comments: CommentWithRelations[]; nextCursor: string | null }>;
    fetchCommentReplies?: (params: { parentId: string; cursor?: string; limit?: number }) => Promise<{ replies: CommentWithRelations[]; nextCursor: string | null }>;
    onSubmitComment?: (params: { slideId: string; text: string; parentId: string | null; imageFile: File | null }) => Promise<any>;
    onLikeComment?: (commentId: string) => Promise<any>;
    onDeleteComment?: (commentId: string) => Promise<any>;
    onReportComment?: (commentId: string) => void;
    subscribeToComments?: (slideId: string, onNewComment: () => void) => () => void;
  };
}

const defaultTranslations: Record<string, string> = {
  'commentsTitle': 'Komentarze ({{count}})',
  'addCommentPlaceholder': 'Dodaj komentarz...',
  'replyTo': 'Odpowiedz użytkownikowi {{user}}...',
  'reply': 'Odpowiedz',
  'replyingTo': 'Odpowiadasz użytkownikowi {{user}}',
  'top': 'Najlepsze',
  'newest': 'Najnowsze',
  'loadMore': 'Pokaż więcej',
  'noCommentsYet': 'Brak komentarzy. Bądź pierwszy!',
  'commentsError': 'Błąd podczas ładowania komentarzy.',
  'commentPostError': 'Błąd podczas dodawania komentarza.',
  'delete': 'Usuń',
  'report': 'Zgłoś',
  'deleteConfirmation': 'Czy na pewno chcesz usunąć ten komentarz?',
  'reportSubmitted': 'Zgłoszenie zostało wysłane.',
  'loginRequired': 'Musisz się zalogować, aby wykonać tę akcję.',
  'viewReplies': 'Zobacz odpowiedzi ({{count}})',
  'hideReplies': 'Ukryj odpowiedzi',
  'imageTooLarge': 'Obraz jest zbyt duży (max 2MB).',
  'yourAvatar': 'Twój awatar',
};

const CommentsModule: React.FC<CommentsModuleProps> = ({
  mode,
  slideId,
  userProfile,
  initialCommentsCount = 0,
  isOpen = false,
  onClose = () => {},
  lang = 'pl',
  translations = {},
  addToast,
  onOpenLogin,
  onAvatarClick = (userId) => console.log('Avatar click:', userId),
  api,
}) => {
  const t = (key: string, params?: any) => {
    let text = translations[key] || defaultTranslations[key] || key;
    if (params) {
      Object.keys(params).forEach((param) => {
        text = text.replace(`{{${param}}}`, params[param]);
      });
    }
    return text;
  };

  const finalApi = {
    fetchComments: api?.fetchComments || defaultFetchComments,
    fetchCommentReplies: api?.fetchCommentReplies || (async ({ parentId, cursor }) => {
        const res = await fetch(`/api/comments/replies?parentId=${parentId}&cursor=${cursor || ''}`);
        return res.json().then(data => ({ replies: data.replies, nextCursor: data.nextCursor }));
    }),
    onSubmitComment: api?.onSubmitComment || (async ({ slideId, text, parentId, imageFile }) => {
        let imageUrl = null;
        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            imageUrl = uploadData.imageUrl;
        }
        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slideId, text, parentId, imageUrl }),
        });
        return res.json();
    }),
    onLikeComment: api?.onLikeComment || (async (commentId) => {
        const res = await fetch('/api/comments/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commentId }),
        });
        return res.json();
    }),
    onDeleteComment: api?.onDeleteComment || (async (commentId) => {
        const res = await fetch('/api/comments', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commentId }),
        });
        return res.json();
    }),
    onReportComment: api?.onReportComment || ((commentId) => {
        addToast?.(t('reportSubmitted'), 'success');
    }),
    subscribeToComments: api?.subscribeToComments,
  };

  if (mode === 'embedded') {
    return (
      <EmbeddedComments
        userProfile={userProfile}
        slideId={slideId}
        fetchComments={finalApi.fetchComments}
        onSubmitComment={async (text, sId) => finalApi.onSubmitComment({ slideId: sId, text, parentId: null, imageFile: null })}
        onLikeAction={finalApi.onLikeComment}
        onOpenLogin={onOpenLogin}
        addToast={addToast}
      />
    );
  }

  return (
    <CommentsModal
      isOpen={isOpen}
      onClose={onClose}
      slideId={slideId}
      initialCommentsCount={initialCommentsCount}
      userProfile={userProfile}
      lang={lang}
      t={t}
      addToast={addToast}
      fetchComments={finalApi.fetchComments}
      fetchCommentReplies={finalApi.fetchCommentReplies}
      onLikeComment={finalApi.onLikeComment}
      onSubmitComment={finalApi.onSubmitComment}
      onDeleteComment={finalApi.onDeleteComment}
      onReportComment={finalApi.onReportComment}
      onAvatarClick={onAvatarClick}
      onOpenLogin={onOpenLogin}
      subscribeToComments={finalApi.subscribeToComments}
    />
  );
};

export default CommentsModule;
