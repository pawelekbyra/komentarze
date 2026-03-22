"use client";

import React, { useState, useCallback } from 'react';
import { useCommentsContext, useTranslation } from '../context/CommentsContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import CommentSkeleton from './CommentSkeleton';
import { Loader2 } from 'lucide-react';
import { Comment } from '../shared/validators';

const CommentList: React.FC = () => {
  const {
    comments,
    fetchNextComments,
    hasNextComments,
    isCommentsLoading,
    isFetchingNextComments,
    commentsError,
    refetchComments,
    postComment,
    updateComment,
    likeComment,
    deleteComment,
    reportComment,
    isPosting,
  } = useCommentsContext();

  const { t } = useTranslation();
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const handlePost = useCallback(async (text: string, file: File | null) => {
    await postComment({ text, parentId: replyingTo?.id || null, imageFile: file });
    setReplyingTo(null);
  }, [postComment, replyingTo]);

  if (isCommentsLoading) {
    return (
      <div className="space-y-10">
        <CommentSkeleton count={5} />
      </div>
    );
  }

  if (commentsError) {
    return <ErrorState reset={refetchComments} error={commentsError} />;
  }

  return (
    <div className="space-y-8">
      <CommentInput
        parentId={replyingTo?.id}
        replyingToUser={replyingTo?.author.displayName || replyingTo?.author.username}
        onCancelReply={() => setReplyingTo(null)}
        onSubmit={handlePost}
        isSubmitting={isPosting}
      />

      {comments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment: Comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={likeComment}
              onDelete={deleteComment}
              onReport={reportComment}
              onUpdate={async (id, text) => { await updateComment({ commentId: id, text }); }}
              onStartReply={setReplyingTo}
              renderReplies={(parentId) => (
                <RepliesList parentId={parentId} />
              )}
            />
          ))}

          {hasNextComments && (
            <div className="flex justify-center pt-6">
               <button
                 onClick={() => fetchNextComments()}
                 disabled={isFetchingNextComments}
                 className="px-6 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-bold text-muted-foreground transition-all flex items-center justify-center gap-2"
               >
                 {isFetchingNextComments ? <Loader2 className="animate-spin" size={16} /> : t('loadMore')}
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Internal sub-component for replies
const RepliesList: React.FC<{ parentId: string }> = ({ parentId }) => {
  const {
    getRepliesQuery,
    postComment,
    updateComment,
    likeComment,
    deleteComment,
    reportComment,
  } = useCommentsContext();

  const { t } = useTranslation();
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = getRepliesQuery(parentId);

  const replies = data?.pages.flatMap((page) => page.replies) ?? [];

  const handlePostReply = useCallback(async (text: string, file: File | null) => {
    await postComment({ text, parentId, imageFile: file });
    setReplyingTo(null);
  }, [postComment, parentId]);

  return (
    <div className="space-y-1 mt-1">
      {isLoading && replies.length === 0 && (
         <div className="pl-8 py-4"><Loader2 className="animate-spin text-muted-foreground" size={16} /></div>
      )}

      {replies.map((reply: Comment) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          level={1}
          onLike={likeComment}
          onDelete={deleteComment}
          onReport={reportComment}
          onUpdate={async (id, text) => { await updateComment({ commentId: id, text }); }}
          onStartReply={setReplyingTo}
        />
      ))}

      {replyingTo && (
         <div className="pl-8 py-2">
           <CommentInput
             replyingToUser={replyingTo.author.displayName || replyingTo.author.username}
             onCancelReply={() => setReplyingTo(null)}
             onSubmit={handlePostReply}
             isSubmitting={false} // Would need a way to track specific reply submission state if needed
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
