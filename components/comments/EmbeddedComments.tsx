"use client";

import React, { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Heart, MessageSquare, ArrowUp, Loader2, Smile, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CommentWithRelations } from '@/lib/dto';

interface EmbeddedCommentsProps {
  userProfile?: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
    role: string;
  } | null;
  slideId: string;
  fetchComments: (params: { pageParam?: string; slideId: string; sortBy?: 'newest' | 'top' }) => Promise<{ comments: CommentWithRelations[]; nextCursor: string | null }>;
  onSubmitComment: (text: string, slideId: string) => Promise<any>;
  onLikeAction: (commentId: string) => Promise<any>;
  onOpenLogin?: () => void;
  addToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const EmbeddedComments: React.FC<EmbeddedCommentsProps> = ({
  userProfile,
  slideId,
  fetchComments,
  onSubmitComment,
  onLikeAction,
  onOpenLogin,
  addToast,
}) => {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['comments', slideId, 'top'],
    queryFn: ({ pageParam }) => fetchComments({ pageParam: pageParam as string, slideId, sortBy: 'top' }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!slideId,
  });

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];

  const postMutation = useMutation({
    mutationFn: async (text: string) => {
      return onSubmitComment(text, slideId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
      setNewComment('');
      addToast?.('Komentarz dodany!', 'success');
    },
    onError: () => {
      addToast?.('Błąd podczas dodawania komentarza.', 'error');
    }
  });

  const likeMutation = useMutation({
    mutationFn: async (commentId: string) => {
        return onLikeAction(commentId);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userProfile) return;
    postMutation.mutate(newComment);
  };

  return (
    <div className="space-y-12">
      {/* Input Area */}
      {userProfile ? (
        <form onSubmit={handleSubmit} className="flex gap-4 items-start p-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all focus-within:shadow-md">
          <Image
            src={userProfile.avatar || DEFAULT_AVATAR_URL}
            alt="Twoje zdjęcie"
            width={48}
            height={48}
            className="rounded-2xl border border-slate-200 shrink-0"
          />
          <div className="flex-1 space-y-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Co o tym sądzisz?"
              className="w-full bg-transparent text-slate-900 focus:outline-none text-lg resize-none min-h-[100px]"
            />
            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
              <div className="flex gap-2">
                 <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><ImageIcon size={20} /></button>
                 <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Smile size={20} /></button>
              </div>
              <button
                type="submit"
                disabled={!newComment.trim() || postMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
              >
                {postMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ArrowUp size={18} />}
                Publikuj
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 border-dashed text-center">
          <p className="text-slate-500 font-medium mb-4">Zaloguj się, aby dołączyć do dyskusji.</p>
          <button
            onClick={() => onOpenLogin?.()}
            className="text-primary font-bold hover:underline"
          >
            Zaloguj się teraz
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-8">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-10 bg-slate-200 rounded w-full" />
            </div>
          </div>
        ))}

        {!isLoading && comments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 font-medium">Brak komentarzy. Bądź pierwszy!</p>
          </div>
        )}

        {comments.map((comment: CommentWithRelations) => (
          <div key={comment.id} className="group flex gap-4 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Image
              src={comment.author?.avatar || DEFAULT_AVATAR_URL}
              alt={comment.author?.username || 'Użytkownik'}
              width={48}
              height={48}
              className="rounded-2xl border border-slate-200 shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-slate-900">{comment.author?.displayName || comment.author?.username}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">•</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: pl })}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4 text-lg">
                {comment.text}
              </p>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => likeMutation.mutate(comment.id)}
                  disabled={likeMutation.isPending}
                  className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors"
                >
                  <Heart size={18} className={cn(comment.isLiked && "fill-primary text-primary")} />
                  <span className="text-xs font-black">{comment._count?.likes || 0}</span>
                </button>
                <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <MessageSquare size={18} />
                  <span className="text-xs font-black">{comment._count?.replies || 0}</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full py-4 text-slate-400 font-bold hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            {isFetchingNextPage ? <Loader2 className="animate-spin" /> : 'Pokaż więcej komentarzy'}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmbeddedComments;
