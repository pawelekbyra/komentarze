"use client";
// @ts-nocheck

import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare, Loader2, MoreHorizontal, Trash, Flag, Smile, ChevronDown, ImageIcon, ArrowUp } from 'lucide-react';
import Image from 'next/image';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { CommentWithRelations } from '@/lib/dto';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import UserBadge from './UserBadge';
import { cn } from '@/lib/utils';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideId: string | null;
  initialCommentsCount: number;
  userProfile?: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
    role: string;
  } | null;
  lang?: string;
  t: (key: string, params?: any) => string;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'locked') => void;
  fetchComments: (params: { pageParam?: string; slideId: string; sortBy?: 'newest' | 'top' }) => Promise<{ comments: CommentWithRelations[]; nextCursor: string | null }>;
  fetchCommentReplies: (params: { parentId: string; cursor?: string; limit?: number }) => Promise<{ replies: CommentWithRelations[]; nextCursor: string | null }>;
  onLikeComment: (commentId: string) => Promise<any>;
  onSubmitComment: (params: { slideId: string; text: string; parentId: string | null; imageFile: File | null }) => Promise<any>;
  onDeleteComment: (commentId: string) => Promise<any>;
  onReportComment: (commentId: string) => void;
  onAvatarClick: (userId: string) => void;
  onOpenLogin?: () => void;
  onIncrementCommentCount?: (slideId: string) => void;
  subscribeToComments?: (slideId: string, onNewComment: () => void) => () => void;
}

interface CommentItemProps {
  comment: CommentWithRelations;
  onLike: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onReport: (id: string) => void;
  onAvatarClick: (userId: string) => void;
  onStartReply: (comment: CommentWithRelations) => void;
  currentUserId?: string;
  lang: string;
  level?: number;
  slideId: string | null;
  lastRepliedParentId?: string | null;
  fetchCommentReplies: (params: { parentId: string; cursor?: string; limit?: number }) => Promise<{ replies: CommentWithRelations[]; nextCursor: string | null }>;
  t: (key: string, params?: any) => string;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'locked') => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  onDelete,
  onReport,
  onAvatarClick,
  onStartReply,
  currentUserId,
  lang,
  level = 0,
  slideId,
  lastRepliedParentId,
  fetchCommentReplies,
  t,
  addToast,
}) => {
  const [areRepliesVisible, setAreRepliesVisible] = useState(false);

  useEffect(() => {
    if (lastRepliedParentId === comment.id) {
        setAreRepliesVisible(true);
    }
  }, [lastRepliedParentId, comment.id]);

  const {
    data: repliesData,
    fetchNextPage: fetchReplies,
    hasNextPage: hasMoreReplies,
    isLoading: isLoadingReplies,
  } = useInfiniteQuery({
    queryKey: ['comments', slideId, 'replies', comment.id],
    queryFn: ({ pageParam }) => fetchCommentReplies({ parentId: comment.id, cursor: pageParam as string }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: areRepliesVisible,
  });

  const replies = repliesData?.pages.flatMap(page => page.replies || []) ?? [];

  const isLiked = comment.isLiked;
  const likeCount = comment._count?.likes ?? 0;
  const replyCount = comment._count?.replies ?? 0;

  const handleToggleReplies = () => {
    setAreRepliesVisible(prev => !prev);
  };

  const author = comment.author;
  const dateLocale = lang === 'pl' ? pl : enUS;
  const formattedTime = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: dateLocale });

  const isL0 = level === 0;
  const isL1Plus = level >= 1;

  const safeAuthor = author || {
      id: 'unknown',
      displayName: 'Unknown',
      username: 'unknown',
      avatar: DEFAULT_AVATAR_URL,
      role: 'user'
  };

  const handleLikeClick = () => {
    if (!currentUserId) {
      addToast?.(t('loginRequired') || 'Musisz się zalogować', 'locked');
      return;
    }
    onLike(comment.id);
  };

  const isPatron = safeAuthor.role === 'patron';
  const isAuthor = safeAuthor.role === 'author';

  let avatarBorderClass = 'border-white/80';
  if (isPatron) avatarBorderClass = 'border-yellow-500';
  else if (isAuthor) avatarBorderClass = 'border-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex items-start gap-2 group", isL1Plus && "pl-8")}
    >
      <div
        onClick={() => onAvatarClick(safeAuthor.id)}
        className="cursor-pointer flex-shrink-0 flex flex-col items-center gap-1"
      >
        <Image
          src={safeAuthor.avatar || DEFAULT_AVATAR_URL}
          alt={t('userAvatar', { user: safeAuthor.displayName || 'User' })}
          width={isL0 ? 36 : 28}
          height={isL0 ? 36 : 28}
          className={cn("rounded-full object-cover border", avatarBorderClass)}
        />
        <UserBadge role={safeAuthor.role} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-transparent rounded-lg">
           <div className="flex items-center gap-2">
             <p className="text-xs font-semibold text-[#A6A6A6] cursor-pointer hover:underline" onClick={() => onAvatarClick(safeAuthor.id)}>
                {safeAuthor.displayName || safeAuthor.username || 'User'}
              </p>
           </div>
          <p className="text-[13px] text-white whitespace-pre-wrap break-words">
            {isL1Plus && comment.parentAuthorUsername && (
                <span
                  className="text-primary font-semibold mr-1 cursor-pointer"
                  onClick={() => comment.parentAuthorId && onAvatarClick(comment.parentAuthorId)}
                >
                  {comment.parentAuthorUsername}
                </span>
            )}
            {comment.text}
          </p>
          {comment.imageUrl && (
            <div className="mt-2">
              <Image src={comment.imageUrl} alt="Comment image" width={200} height={200} className="rounded-lg object-cover" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#808080] mt-[-1px]">
          <span>{formattedTime}</span>
          {currentUserId && (
            <button onClick={() => onStartReply(comment)} className="font-semibold hover:text-white transition-colors">
              {t('reply')}
            </button>
          )}
          {currentUserId && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[150px] bg-[#282828] rounded-md p-1 shadow-xl z-[60] border border-white/10" align="end">
                  {currentUserId === comment.authorId ? (
                    <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 text-sm text-[#FF4D4D] hover:bg-white/10 rounded cursor-pointer outline-none" onSelect={() => { if (confirm(t('deleteConfirmation'))) onDelete(comment.id); }}>
                      <Trash size={14} />{t('delete') || 'Usuń'}
                    </DropdownMenu.Item>
                  ) : (
                    <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 text-sm text-white hover:bg-white/10 rounded cursor-pointer outline-none" onSelect={() => onReport(comment.id)}>
                      <Flag size={14} />{t('report') || 'Zgłoś'}
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>

        {replyCount > 0 && (
          <div className="mt-2">
            <button onClick={handleToggleReplies} className="flex items-center gap-1.5 text-xs text-[#8F8F8F] font-semibold mb-2">
              <ChevronDown size={16} className={cn("transition-transform duration-200", areRepliesVisible && "rotate-180")} />
              {areRepliesVisible ? t('hideReplies') : t('viewReplies', { count: replyCount.toString() })}
            </button>
            <AnimatePresence>
            {areRepliesVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden pt-2"
              >
                {isLoadingReplies && replies.length === 0 && (
                   <div className="flex justify-center p-2"><Loader2 className="animate-spin h-4 w-4 text-primary" /></div>
                )}
                {replies.map((reply) => (
                  <MemoizedCommentItem
                    key={reply.id}
                    slideId={slideId}
                    comment={reply}
                    onLike={onLike}
                    onDelete={onDelete}
                    onReport={onReport}
                    onAvatarClick={onAvatarClick}
                    onStartReply={onStartReply}
                    currentUserId={currentUserId}
                    lang={lang}
                    level={level + 1}
                    lastRepliedParentId={lastRepliedParentId}
                    fetchCommentReplies={fetchCommentReplies}
                    t={t}
                    addToast={addToast}
                  />
                ))}
                {hasMoreReplies && (
                   <button onClick={() => fetchReplies()} disabled={isLoadingReplies} className="text-xs text-[#8F8F8F] font-semibold flex items-center gap-2">
                      {isLoadingReplies ? <Loader2 className="animate-spin h-3 w-3" /> : t('loadMore')}
                   </button>
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-0.5 text-[#808080] pt-2">
        <button onClick={handleLikeClick} className="group/like">
          <Heart size={18} className={cn("transition-colors", isLiked ? 'text-[#FE2C55] fill-current' : 'group-hover/like:text-white')} />
        </button>
        <span className="text-[11px] font-semibold">{likeCount > 0 ? likeCount : ''}</span>
      </div>
    </motion.div>
  );
};

const MemoizedCommentItem = React.memo(CommentItem);

const recursivelyUpdateComment = (comments: CommentWithRelations[], commentId: string, updateFn: (comment: CommentWithRelations) => CommentWithRelations): [CommentWithRelations[], boolean] => {
  let foundAndUpdated = false;
  if (!comments) return [[], false];
  const updatedComments = comments.map(c => {
    if (c.id === commentId) {
      foundAndUpdated = true;
      return updateFn(c);
    }
    if (c.replies && c.replies.length > 0) {
      const [updatedReplies, didUpdate] = recursivelyUpdateComment(c.replies, commentId, updateFn);
      if (didUpdate) {
        foundAndUpdated = true;
        return { ...c, replies: updatedReplies };
      }
    }
    return c;
  });
  return [updatedComments, foundAndUpdated];
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  slideId,
  initialCommentsCount,
  userProfile,
  lang = 'pl',
  t,
  addToast,
  fetchComments,
  fetchCommentReplies,
  onLikeComment,
  onSubmitComment,
  onDeleteComment,
  onReportComment,
  onAvatarClick,
  onOpenLogin,
  onIncrementCommentCount,
  subscribeToComments,
}) => {
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('top');
  const [replyingTo, setReplyingTo] = useState<CommentWithRelations | null>(null);
  const [lastRepliedParentId, setLastRepliedParentId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const {
    data, error, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['comments', slideId, sortBy],
    queryFn: ({ pageParam }) => fetchComments({ pageParam: pageParam as string, slideId: slideId!, sortBy }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isOpen && !!slideId,
  });

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];
  const totalCommentCount = initialCommentsCount;

  useEffect(() => {
    if (!isOpen || !slideId || !subscribeToComments) return;
    return subscribeToComments(slideId, () => {
        queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    });
  }, [isOpen, slideId, queryClient, subscribeToComments]);

  useEffect(() => {
    if (!isOpen) {
      setNewComment('');
      setReplyingTo(null);
      setImageFile(null);
      setShowEmojiPicker(false);
    }
  }, [isOpen]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [modalHeight, setModalHeight] = useState<string>('75vh');

  useEffect(() => {
      setModalHeight(`${window.innerHeight * 0.75}px`);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newComment]);

  const likeMutation = useMutation({
    mutationFn: (commentId: string) => onLikeComment(commentId),
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', slideId, sortBy] });
      const previousData = queryClient.getQueryData(['comments', slideId, sortBy]);

      queryClient.setQueryData(['comments', slideId, sortBy], (oldData: any) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map((page: any) => {
              const [updatedComments] = recursivelyUpdateComment(page.comments || [], commentId, (comment) => {
                  const isLiked = comment.isLiked;
                  const newLikeCount = (comment._count?.likes ?? 0) + (isLiked ? -1 : 1);
                  return { ...comment, isLiked: !isLiked, _count: { ...comment._count, likes: newLikeCount } };
              });
              return { ...page, comments: updatedComments };
          });
          return { ...oldData, pages: newPages };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['comments', slideId, sortBy], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId, sortBy] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ parentId, text, imageFile }: { parentId: string | null; text: string; imageFile: File | null }) => {
      return onSubmitComment({ slideId: slideId!, text, parentId, imageFile });
    },
    onMutate: async ({ parentId, text, imageFile }) => {
      const optimisticComment: CommentWithRelations = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        imageUrl: imageFile ? URL.createObjectURL(imageFile) : null,
        authorId: userProfile!.id,
        slideId: slideId!,
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: userProfile!.id,
          username: userProfile!.username,
          displayName: userProfile!.displayName || null,
          avatar: userProfile!.avatar || null,
          role: userProfile!.role || 'user',
        },
        isLiked: false,
        _count: { likes: 0, replies: 0 },
        parentAuthorId: replyingTo ? (replyingTo.author?.id || null) : null,
        parentAuthorUsername: replyingTo ? (replyingTo.author?.displayName || replyingTo.author?.username || 'Unknown') : null,
        replies: [],
      };

      if (parentId) {
        await queryClient.cancelQueries({ queryKey: ['comments', slideId, 'replies', parentId] });
        const previousReplies = queryClient.getQueryData(['comments', slideId, 'replies', parentId]);
        queryClient.setQueryData(['comments', slideId, 'replies', parentId], (old: any) => {
            const newPages = old ? [...old.pages] : [{ replies: [], nextCursor: null }];
            if (!newPages[0]) newPages[0] = { replies: [], nextCursor: null };
            const newFirstPageReplies = [optimisticComment, ...(newPages[0].replies || [])];
            newPages[0] = { ...newPages[0], replies: newFirstPageReplies };
            return { ...old, pages: newPages, pageParams: old?.pageParams || [null] };
        });
        queryClient.setQueryData(['comments', slideId, sortBy], (old: any) => {
            if (!old) return old;
            const newPages = old.pages.map((page: any) => {
                const [updatedComments] = recursivelyUpdateComment(page.comments || [], parentId, (comment) => ({
                    ...comment,
                    _count: { ...comment._count, likes: comment._count?.likes ?? 0, replies: (comment._count?.replies ?? 0) + 1 },
                }));
                return { ...page, comments: updatedComments };
            });
            return { ...old, pages: newPages };
        });
        return { previousReplies };
      } else {
        await queryClient.cancelQueries({ queryKey: ['comments', slideId, sortBy] });
        const previousComments = queryClient.getQueryData(['comments', slideId, sortBy]);
        queryClient.setQueryData(['comments', slideId, sortBy], (old: any) => {
          const newPages = old ? [...old.pages] : [];
          if (newPages.length === 0) newPages.push({ comments: [], nextCursor: null });
          const currentComments = newPages[0].comments || [];
          newPages[0] = { ...newPages[0], comments: [optimisticComment, ...currentComments] };
          return { ...old, pages: newPages, pageParams: old?.pageParams || [null] };
        });
        return { previousComments };
      }
    },
    onError: (err, { parentId }, context) => {
      addToast?.(t('commentPostError'), 'error');
      queryClient.invalidateQueries({ queryKey: ['comments', slideId], exact: false });
    },
    onSuccess: (data, variables) => {
      if (variables.parentId) {
          setLastRepliedParentId(variables.parentId);
          setTimeout(() => {
             queryClient.invalidateQueries({ queryKey: ['comments', slideId, 'replies', variables.parentId] });
          }, 1000);
      } else {
        setSortBy('newest');
        queryClient.invalidateQueries({ queryKey: ['comments', slideId, 'newest'] });
        if (sortBy !== 'newest') queryClient.invalidateQueries({ queryKey: ['comments', slideId, sortBy] });
        onIncrementCommentCount?.(slideId!);
      }
      setNewComment('');
      setReplyingTo(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => onDeleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', slideId] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();
    if ((!trimmedComment && !imageFile) || !userProfile || !slideId) return;
    replyMutation.mutate({ parentId: replyingTo?.id || null, text: trimmedComment, imageFile });
    setImageFile(null);
  };

  const handleStartReply = (comment: CommentWithRelations) => {
    if (!userProfile) {
        onOpenLogin?.();
        return;
    }
    setReplyingTo(comment);
    textareaRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const onEmojiClick = (emojiObject: EmojiClickData) => {
    setNewComment(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        addToast?.(t('imageTooLarge'), 'error');
        return;
      }
      setImageFile(file);
    }
  };

  const renderContent = () => {
    if (isLoading && comments.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (error) return <div className="flex-1 flex items-center justify-center text-red-400 p-4 h-full">{t('commentsError')}</div>;
    if (comments.length === 0) return <div className="flex-1 flex items-center justify-center text-white/60 p-4 h-full text-center">{t('noCommentsYet')}</div>;

    return (
      <div className="px-2 pt-2 custom-scrollbar flex-1">
        <div className="space-y-3">
          {comments.map((comment) => (
            <MemoizedCommentItem
              key={comment.id}
              slideId={slideId}
              comment={comment}
              onLike={likeMutation.mutate}
              onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
              onStartReply={handleStartReply}
              onReport={(id) => onReportComment(id)}
              onAvatarClick={onAvatarClick}
              currentUserId={userProfile?.id}
              lang={lang}
              lastRepliedParentId={lastRepliedParentId}
              fetchCommentReplies={fetchCommentReplies}
              t={t}
              addToast={addToast}
            />
          ))}
          {hasNextPage && (
            <div className="flex justify-center py-2">
              <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="text-sm text-primary hover:text-primary/80 disabled:opacity-50 flex items-center gap-2">
                {isFetchingNextPage && <Loader2 className="animate-spin h-3 w-3" />}
                {t('loadMore')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="absolute inset-0 bg-black/60 z-50 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={onClose}>
          <motion.div
            ref={modalRef}
            className="w-full app-modal-glass rounded-t-[2.5rem] flex flex-col border-t comments-modal overflow-hidden"
            style={{ height: modalHeight }}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="app-handle" />
            <div className="flex-shrink-0 relative text-center pb-4 pt-1 border-b border-white/5">
              <h2 className="text-base font-bold text-white tracking-tight">{t('commentsTitle', { count: totalCommentCount.toString() })}</h2>
              <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"><X size={24} /></button>
            </div>

            <div className="flex-shrink-0 px-4 pt-3 pb-2 flex items-center gap-4 text-sm">
                <button onClick={() => setSortBy('top')} className={cn("font-semibold", sortBy === 'top' ? 'text-white' : 'text-white/40')}>{t('top')}</button>
                <button onClick={() => setSortBy('newest')} className={cn("font-semibold", sortBy === 'newest' ? 'text-white' : 'text-white/40')}>{t('newest')}</button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col pb-20">{renderContent()}</div>

            <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/80 backdrop-blur-xl pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-20">
              {replyingTo && (
                <div className="bg-[#282828] px-4 py-1.5 text-xs text-[#A6A6A6] flex justify-between items-center">
                  <span>{t('replyingTo', { user: replyingTo.author?.displayName || replyingTo.author?.username || '' })}</span>
                  <button onClick={handleCancelReply}><X size={14} /></button>
                </div>
              )}
              {userProfile ? (
                <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2">
                  <Image
                    src={userProfile.avatar || DEFAULT_AVATAR_URL}
                    alt={t('yourAvatar')}
                    width={36}
                    height={36}
                    className={cn("w-9 h-9 rounded-full object-cover border", userProfile.role === 'patron' ? 'border-yellow-500' : (userProfile.role === 'author' ? 'border-primary' : 'border-white/80'))}
                  />
                  <div className="flex-1 relative flex items-center bg-zinc-950/50 border border-white/10 rounded-2xl transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)]">
                    <input type="file" ref={imageInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    <textarea
                      ref={textareaRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={replyingTo ? t('replyTo', { user: replyingTo.author?.displayName || replyingTo.author?.username || '' }) : t('addCommentPlaceholder')}
                      className="w-full pl-4 pr-20 py-2 bg-transparent text-white focus:outline-none text-sm resize-none min-h-[40px] max-h-[120px]"
                      disabled={replyMutation.isPending}
                      rows={1}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                       <button type="button" className="text-white/40 hover:text-white" title="Add image" onClick={() => imageInputRef.current?.click()}><ImageIcon size={20} /></button>
                       <button type="button" className="text-white/40 hover:text-white" title="Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Smile size={20} /></button>
                    </div>
                  </div>
                   {showEmojiPicker && (
                      <div className="absolute bottom-16 right-2 z-20">
                         <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} previewConfig={{ showPreview: false }} />
                      </div>
                   )}
                   <button type="submit" className="p-2 disabled:opacity-50 flex items-center justify-center transition-all active:scale-90" disabled={(!newComment.trim() && !imageFile) || replyMutation.isPending}>
                    {replyMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_-3px_hsl(var(--primary)/0.5)]">
                            <ArrowUp size={20} strokeWidth={3} />
                        </div>
                    )}
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-center h-12 text-center px-4 text-[#8F8F8F] text-sm">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onOpenLogin?.()} className="text-[#8F8F8F] font-semibold underline active:opacity-70 transition-opacity">Zaloguj się</button>
                    <span>, aby skomentować</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsModal;
