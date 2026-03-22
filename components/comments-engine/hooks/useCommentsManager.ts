"use client";

import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { CommentAdapter, UserProfile } from '../shared/types';
import { Comment } from '../shared/validators';
import { useCallback } from 'react';

export const useCommentsManager = (adapter: CommentAdapter, slideId: string, sortBy: 'newest' | 'top') => {
  const queryClient = useQueryClient();

  // --- Queries ---

  const {
    data: commentsData,
    fetchNextPage: fetchNextComments,
    hasNextPage: hasNextComments,
    isLoading: isCommentsLoading,
    isFetchingNextPage: isFetchingNextComments,
    error: commentsError,
    refetch: refetchComments,
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

  const getRepliesQuery = useCallback((parentId: string) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useInfiniteQuery<
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
  }, [adapter, slideId]);

  // --- Mutations ---

  const postCommentMutation = useMutation({
    mutationFn: (params: { text: string; parentId: string | null; imageFile: File | null }) =>
      adapter.submitComment({ slideId, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: (params: { commentId: string; text: string }) =>
      adapter.updateComment(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => adapter.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => adapter.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', slideId] });
    },
  });

  const reportCommentMutation = useMutation({
    mutationFn: (commentId: string) => adapter.reportComment(commentId),
  });

  return {
    comments: commentsData?.pages.flatMap((page) => page.comments) ?? [],
    fetchNextComments,
    hasNextComments,
    isCommentsLoading,
    isFetchingNextComments,
    commentsError,
    refetchComments,

    getRepliesQuery,

    postComment: postCommentMutation.mutateAsync,
    updateComment: updateCommentMutation.mutateAsync,
    likeComment: likeCommentMutation.mutate,
    deleteComment: deleteCommentMutation.mutate,
    reportComment: reportCommentMutation.mutate,

    isPosting: postCommentMutation.isPending,
    isUpdating: updateCommentMutation.isPending,
    isDeleting: deleteCommentMutation.isPending,
  };
};
