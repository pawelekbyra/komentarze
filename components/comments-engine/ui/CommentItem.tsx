"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MoreHorizontal, Trash, Flag, ChevronDown, Edit3, X, Check } from 'lucide-react';
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
  onUpdate: (id: string, text: string) => Promise<void>;
  onStartReply: (comment: Comment) => void;
  renderReplies?: (parentId: string) => React.ReactNode;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  level = 0,
  onLike,
  onDelete,
  onReport,
  onUpdate,
  onStartReply,
  renderReplies,
}) => {
  const { userProfile, theme, onAvatarClick, addToast } = useCommentsContext();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isUpdating, setIsUpdating] = useState(false);
  const [areRepliesVisible, setAreRepliesVisible] = useState(false);

  const isLiked = comment.isLiked;
  const likeCount = comment._count?.likes ?? 0;
  const replyCount = comment._count?.replies ?? 0;

  const formattedTime = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: theme.locale
  });

  const handleLikeClick = useCallback(() => {
    if (!userProfile) {
      addToast?.(t('loginRequired'), 'locked');
      return;
    }
    onLike(comment.id);
  }, [userProfile, onLike, comment.id, addToast, t]);

  const handleUpdate = async () => {
    if (!editText.trim() || editText === comment.text) {
      setIsEditing(false);
      return;
    }
    setIsUpdating(true);
    try {
      await onUpdate(comment.id, editText);
      setIsEditing(false);
    } catch (error) {
      addToast?.(t('commentPostError'), 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(comment.text);
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleUpdate();
    }
  };

  const author = comment.author;
  const maxDepth = theme.maxDepth ?? 5;
  const isL1Plus = level >= 1;
  const indentClass = level > 0 && level <= maxDepth ? "pl-8" : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("flex items-start gap-3 group py-3 border-b border-border last:border-0", indentClass, theme.classes?.comment)}
      role="article"
      aria-label={`Komentarz od ${author.displayName || author.username}`}
    >
      <div
        onClick={() => onAvatarClick?.(author.id)}
        className={cn("cursor-pointer shrink-0 transition-opacity hover:opacity-80", theme.classes?.avatar)}
      >
        <Image
          src={author.avatar || '/default-avatar.png'}
          alt={author.displayName || 'User'}
          width={level === 0 ? 40 : 32}
          height={level === 0 ? 40 : 32}
          className="rounded-full object-cover ring-1 ring-border"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-sm font-bold text-foreground cursor-pointer hover:underline"
            onClick={() => onAvatarClick?.(author.id)}
          >
            {author.displayName || author.username || 'User'}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">•</span>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </div>

        {isEditing ? (
          <div className="mt-1 space-y-2">
            <textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-background border border-input rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
              disabled={isUpdating}
            />
            <div className="flex justify-end gap-2">
               <button
                 onClick={() => { setIsEditing(false); setEditText(comment.text); }}
                 className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                 title="Anuluj (Esc)"
               >
                 <X size={16} />
               </button>
               <button
                 onClick={handleUpdate}
                 disabled={isUpdating || !editText.trim()}
                 className="p-1.5 text-primary hover:opacity-80 transition-opacity disabled:opacity-50"
                 title="Zapisz (Ctrl+Enter)"
               >
                 {isUpdating ? <Check size={16} className="animate-pulse" /> : <Check size={16} />}
               </button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground break-words mb-2 whitespace-pre-wrap">
            {isL1Plus && comment.parentAuthorUsername && (
              <span className="text-primary font-medium mr-1 select-none">@{comment.parentAuthorUsername}</span>
            )}
            {comment.text}
          </p>
        )}

        {comment.imageUrl && !isEditing && (
          <div className="mb-3">
             <Image
               src={comment.imageUrl}
               alt="Comment image"
               width={400}
               height={300}
               className="rounded-lg border border-border max-w-full h-auto"
             />
          </div>
        )}

        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
           <button
             onClick={handleLikeClick}
             className={cn("flex items-center gap-1.5 transition-colors hover:text-primary", isLiked && "text-primary")}
             aria-pressed={isLiked}
           >
             <Heart size={14} className={cn(isLiked && "fill-current")} />
             {likeCount > 0 && <span>{likeCount}</span>}
           </button>

           <button
             onClick={() => onStartReply(comment)}
             className="hover:text-foreground transition-colors"
           >
             {t('reply')}
           </button>

           <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
                  aria-label="Więcej opcji"
                >
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-popover text-popover-foreground rounded-md shadow-lg border border-border p-1 z-50 min-w-[140px] animate-in fade-in zoom-in-95">
                  {userProfile?.id === comment.authorId ? (
                    <>
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted rounded cursor-pointer outline-none transition-colors"
                        onSelect={() => setIsEditing(true)}
                      >
                        <Edit3 size={14} /> Edytuj
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded cursor-pointer outline-none transition-colors"
                        onSelect={() => onDelete(comment.id)}
                      >
                        <Trash size={14} /> {t('delete')}
                      </DropdownMenu.Item>
                    </>
                  ) : (
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted rounded cursor-pointer outline-none transition-colors"
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
               className="flex items-center gap-1.5 text-xs text-primary font-bold hover:opacity-80 transition-opacity"
               aria-expanded={areRepliesVisible}
             >
               <ChevronDown size={14} className={cn("transition-transform duration-200", areRepliesVisible && "rotate-180")} />
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
