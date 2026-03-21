"use client";

import React, { useState, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useCommentsContext, useTranslation } from '../context/CommentsContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import CommentSkeleton from './CommentSkeleton';
import { Loader2 } from 'lucide-react';
import { Comment } from '../shared/validators';
import { cn } from '@/lib/utils';

interface CommentListProps {
  sortBy?: 'newest' | 'top';
}

const CommentList: React.FC<CommentListProps> = ({ sortBy = 'top' }) => {
  const { adapter, slideId, userProfile, addToast } = useCommentsContext();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
    refetch,
  } = useInfiniteQuery<
    { comments: Comment[]; nextCursor: string | null },
    Error,
    InfiniteData<{ comments: Comment[]; nextCursor: string | null }>,
    (string | undefined)[],
    string | undefined
  >({
    queryKey: ['comments', slideId, sortBy],
    queryFn: ({ pageParam }) => adapter.fetchComments({ slideId, pageParam, sortBy }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!slideId,
  });

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];

  const postMutation = useMutation({
    mutationFn: (params: { text: string; parentId: string | null; imageFile: File | null }) =>
      adapter.submitComment({ slideId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
      setReplyingTo(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (params: { commentId: string; text: string }) =>
      adapter.updateComment(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (commentId: string) => adapter.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => adapter.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: (commentId: string) => adapter.reportComment(commentId),
    onSuccess: () => {
      addToast?.(t('reportSubmitted'), 'success');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-10">
        <CommentSkeleton count={5} />
      </div>
    );
  }

  if (error) {
    return <ErrorState reset={refetch} error={error} />;
  }

  return (
    <div className="space-y-8">
      <CommentInput
        parentId={replyingTo?.id}
        replyingToUser={replyingTo?.author.displayName || replyingTo?.author.username}
        onCancelReply={() => setReplyingTo(null)}
        onSubmit={async (text, file) => { await postMutation.mutateAsync({ text, parentId: replyingTo?.id || null, imageFile: file }); }}
        isSubmitting={postMutation.isPending}
      />

      {comments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment: Comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={likeMutation.mutate}
              onDelete={deleteMutation.mutate}
              onReport={reportMutation.mutate}
              onUpdate={async (id, text) => { await updateMutation.mutateAsync({ commentId: id, text }); }}
              onStartReply={setReplyingTo}
              renderReplies={(parentId) => (
                <RepliesList parentId={parentId} />
              )}
            />
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-6">
               <button
                 onClick={() => fetchNextPage()}
                 disabled={isFetchingNextPage}
                 className="px-6 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-bold text-muted-foreground transition-all flex items-center justify-center gap-2"
               >
                 {isFetchingNextPage ? <Loader2 className="animate-spin" size={16} /> : t('loadMore')}
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Internal sub-component for replies to keep things clean
const RepliesList: React.FC<{ parentId: string }> = ({ parentId }) => {
  const { adapter, slideId } = useCommentsContext();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery<
    { replies: Comment[]; nextCursor: string | null },
    Error,
    InfiniteData<{ replies: Comment[]; nextCursor: string | null }>,
    (string | undefined)[],
    string | undefined
  >({
    queryKey: ['comments', slideId, 'replies', parentId],
    queryFn: ({ pageParam }) => adapter.fetchReplies({ parentId, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const replies = data?.pages.flatMap((page) => page.replies) ?? [];

  const postMutation = useMutation({
    mutationFn: (params: { text: string; imageFile: File | null }) =>
      adapter.submitComment({ slideId, parentId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
      setReplyingTo(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (params: { commentId: string; text: string }) =>
      adapter.updateComment(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (commentId: string) => adapter.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => adapter.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  return (
    <div className="space-y-1 mt-1">
      {replies.map((reply: Comment) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          level={1}
          onLike={likeMutation.mutate}
          onDelete={deleteMutation.mutate}
          onReport={() => {}} // Pass from parent context
          onUpdate={async (id, text) => { await updateMutation.mutateAsync({ commentId: id, text }); }}
          onStartReply={setReplyingTo}
        />
      ))}

      {replyingTo && (
         <div className="pl-8 py-2">
           <CommentInput
             replyingToUser={replyingTo.author.displayName || replyingTo.author.username}
             onCancelReply={() => setReplyingTo(null)}
             onSubmit={async (text, file) => { await postMutation.mutateAsync({ text, imageFile: file }); }}
             isSubmitting={postMutation.isPending}
           />
         </div>
      )}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="text-xs text-primary font-bold pl-8 py-3 hover:underline"
        >
          {isFetchingNextPage ? '...' : 'Pokaż więcej odpowiedzi'}
        </button>
      )}
    </div>
  );
}

export default CommentList;
