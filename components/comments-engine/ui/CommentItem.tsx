"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, MoreHorizontal, Trash, Flag, ChevronDown, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Comment } from '../shared/validators';
import { useCommentsContext, useTranslation } from '../context/CommentsContext';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: Comment;
  level?: number;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  onStartReply: (comment: Comment) => void;
  renderReplies?: (parentId: string) => React.ReactNode;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  level = 0,
  onLike,
  onDelete,
  onReport,
  onStartReply,
  renderReplies,
}) => {
  const { userProfile, theme, onAvatarClick, addToast } = useCommentsContext();
  const { t } = useTranslation();
  const [areRepliesVisible, setAreRepliesVisible] = useState(false);

  const isLiked = comment.isLiked;
  const likeCount = comment._count?.likes ?? 0;
  const replyCount = comment._count?.replies ?? 0;

  const formattedTime = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: theme.locale
  });

  const handleLikeClick = () => {
    if (!userProfile) {
      addToast?.(t('loginRequired'), 'locked');
      return;
    }
    onLike(comment.id);
  };

  const author = comment.author;
  const isL1Plus = level >= 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-start gap-3 group py-2", isL1Plus && "pl-8", theme.classes?.comment)}
    >
      <div
        onClick={() => onAvatarClick?.(author.id)}
        className={cn("cursor-pointer shrink-0", theme.classes?.avatar)}
      >
        <Image
          src={author.avatar || '/default-avatar.png'}
          alt={author.displayName || 'User'}
          width={level === 0 ? 40 : 32}
          height={level === 0 ? 40 : 32}
          className="rounded-full object-cover border border-slate-200"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-sm font-bold cursor-pointer hover:underline"
            style={{ color: theme.colors?.text }}
            onClick={() => onAvatarClick?.(author.id)}
          >
            {author.displayName || author.username || 'User'}
          </span>
          <span className="text-[10px] text-slate-400 uppercase">•</span>
          <span className="text-xs text-slate-400">{formattedTime}</span>
        </div>

        <p
          className={cn("text-sm leading-relaxed break-words mb-2", theme.fontSerif)}
          style={{ color: theme.colors?.text }}
        >
          {isL1Plus && comment.parentAuthorUsername && (
            <span className="text-primary font-semibold mr-1">@{comment.parentAuthorUsername}</span>
          )}
          {comment.text}
        </p>

        {comment.imageUrl && (
          <div className="mb-3">
             <Image src={comment.imageUrl} alt="Comment image" width={300} height={200} className="rounded-xl border border-slate-100" />
          </div>
        )}

        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
           <button
             onClick={handleLikeClick}
             className={cn("flex items-center gap-1.5 transition-colors hover:text-primary", isLiked && "text-primary")}
           >
             <Heart size={14} className={cn(isLiked && "fill-current")} />
             {likeCount > 0 && <span>{likeCount}</span>}
           </button>

           <button
             onClick={() => onStartReply(comment)}
             className="hover:text-slate-600 transition-colors"
           >
             {t('reply')}
           </button>

           <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-white rounded-lg shadow-xl border border-slate-100 p-1 z-50 min-w-[120px]">
                  {userProfile?.id === comment.authorId ? (
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded cursor-pointer outline-none"
                      onSelect={() => onDelete(comment.id)}
                    >
                      <Trash size={14} /> {t('delete')}
                    </DropdownMenu.Item>
                  ) : (
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded cursor-pointer outline-none"
                      onSelect={() => onReport(comment.id)}
                    >
                      <Flag size={14} /> {t('report')}
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
           </DropdownMenu.Root>
        </div>

        {replyCount > 0 && renderReplies && (
           <div className="mt-2">
             <button
               onClick={() => setAreRepliesVisible(!areRepliesVisible)}
               className="flex items-center gap-1.5 text-xs text-primary font-bold"
             >
               <ChevronDown size={14} className={cn("transition-transform", areRepliesVisible && "rotate-180")} />
               {areRepliesVisible ? t('hideReplies') : t('viewReplies', { count: replyCount.toString() })}
             </button>

             <AnimatePresence>
               {areRepliesVisible && (
                 <motion.div
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="overflow-hidden"
                 >
                   {renderReplies(comment.id)}
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(CommentItem);
