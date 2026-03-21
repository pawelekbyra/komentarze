import { Comment } from './validators';

export interface UserProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
  role: string;
}

export interface CommentAdapter {
  fetchComments: (params: {
    slideId: string;
    pageParam?: string;
    sortBy?: 'newest' | 'top';
    limit?: number;
  }) => Promise<{ comments: Comment[]; nextCursor: string | null }>;

  fetchReplies: (params: {
    parentId: string;
    cursor?: string;
    limit?: number;
  }) => Promise<{ replies: Comment[]; nextCursor: string | null }>;

  submitComment: (params: {
    slideId: string;
    text: string;
    parentId: string | null;
    imageFile: File | null;
  }) => Promise<Comment>;

  updateComment: (params: {
    commentId: string;
    text: string;
  }) => Promise<Comment>;

  likeComment: (commentId: string) => Promise<{ isLiked: boolean; likesCount: number }>;

  deleteComment: (commentId: string) => Promise<void>;

  reportComment: (commentId: string) => Promise<void>;
}

export interface CommentsTranslations {
  commentsTitle: string;
  addCommentPlaceholder: string;
  replyTo: string;
  reply: string;
  replyingTo: string;
  top: string;
  newest: string;
  loadMore: string;
  noCommentsYet: string;
  commentsError: string;
  commentPostError: string;
  delete: string;
  report: string;
  deleteConfirmation: string;
  reportSubmitted: string;
  loginRequired: string;
  viewReplies: string;
  hideReplies: string;
  imageTooLarge: string;
  yourAvatar: string;
  beFirst: string;
  [key: string]: string | undefined;
}

import { Locale } from 'date-fns';

export interface CommentsTheme {
  locale?: Locale;
  maxDepth?: number;
  classes?: {
    root?: string;
    comment?: string;
    avatar?: string;
    input?: string;
    button?: string;
    [key: string]: string | undefined;
  };
}
