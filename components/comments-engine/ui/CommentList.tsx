"use client";

import React, { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useCommentsContext, useTranslation } from '../context/CommentsContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
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
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
      setReplyingTo(null);
      addToast?.('Dodano!', 'success');
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
      addToast?.('Usunięto', 'info');
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
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error) {
    return <ErrorState reset={refetch} />;
  }

  if (comments.length === 0) {
    return (
      <div className="space-y-8">
        <CommentInput
          onSubmit={async (text, file) => { await postMutation.mutateAsync({ text, parentId: null, imageFile: file }); }}
          isSubmitting={postMutation.isPending}
        />
        <EmptyState />
      </div>
    );
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

      <div className="space-y-2">
        {comments.map((comment: Comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onLike={likeMutation.mutate}
            onDelete={deleteMutation.mutate}
            onReport={reportMutation.mutate}
            onStartReply={setReplyingTo}
            renderReplies={(parentId) => (
               <RepliesList parentId={parentId} />
            )}
          />
        ))}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full py-4 text-primary font-bold hover:underline transition-all flex items-center justify-center gap-2"
          >
            {isFetchingNextPage ? <Loader2 className="animate-spin" size={16} /> : t('loadMore')}
          </button>
        )}
      </div>
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
      // toast is handled in parent context usually
    },
  });

  return (
    <div className="space-y-2 mt-2">
      {replies.map((reply: Comment) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          level={1}
          onLike={likeMutation.mutate}
          onDelete={deleteMutation.mutate}
          onReport={reportMutation.mutate}
          onStartReply={setReplyingTo}
        />
      ))}

      {replyingTo && (
         <div className="pl-8 mt-2">
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
          className="text-xs text-primary font-bold pl-8 py-2"
        >
          {isFetchingNextPage ? '...' : 'Pokaż więcej odpowiedzi'}
        </button>
      )}
    </div>
  );
}

export default CommentList;
