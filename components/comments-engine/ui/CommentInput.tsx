"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ImageIcon, Smile, ArrowUp, Loader2, X } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useCommentsContext, useTranslation } from '../context/CommentsContext';
import { cn } from '@/lib/utils';

interface CommentInputProps {
  parentId?: string | null;
  replyingToUser?: string | null;
  onCancelReply?: () => void;
  onSubmit: (text: string, imageFile: File | null) => Promise<void>;
  isSubmitting?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  parentId,
  replyingToUser,
  onCancelReply,
  onSubmit,
  isSubmitting = false,
}) => {
  const { userProfile, theme, onAuthRequired, addToast } = useCommentsContext();
  const { t } = useTranslation();

  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        addToast?.(t('imageTooLarge'), 'error');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const onEmojiClick = (emojiObject: EmojiClickData) => {
    setText(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onAuthRequired?.();
      return;
    }
    if (!text.trim() && !imageFile) return;

    try {
      await onSubmit(text, imageFile);
      setText('');
      removeImage();
    } catch (error) {
      // addToast?.(t('commentPostError'), 'error'); // handled by parent typically
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && replyingToUser) {
      onCancelReply?.();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as any);
    }
  };

  if (!userProfile) {
    return (
      <div className="p-6 bg-muted rounded-xl border border-dashed border-border text-center">
        <button
          onClick={() => onAuthRequired?.()}
          className="text-primary font-bold hover:underline"
        >
          {t('loginRequired')}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", theme.classes?.input)}>
      {replyingToUser && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-muted rounded-t-lg text-xs font-bold text-muted-foreground">
          <span>{t('replyingTo', { user: replyingToUser })}</span>
          <button onClick={onCancelReply} title="Anuluj (Esc)"><X size={14} /></button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex gap-3 items-start p-4 bg-background rounded-xl border border-border shadow-sm transition-all focus-within:shadow-md focus-within:border-primary/50",
          replyingToUser && "rounded-t-none border-t-0"
        )}
      >
        <Image
          src={userProfile.avatar || '/default-avatar.png'}
          alt={t('yourAvatar')}
          width={40}
          height={40}
          className="rounded-full border border-border shrink-0"
        />

        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyingToUser ? t('replyTo', { user: replyingToUser }) : t('addCommentPlaceholder')}
            className="w-full bg-transparent text-foreground focus:outline-none text-sm resize-none min-h-[40px] max-h-[300px] py-2 whitespace-pre-wrap"
            disabled={isSubmitting}
          />

          {imagePreview && (
            <div className="relative inline-block mt-2">
              <Image src={imagePreview} alt="Preview" width={120} height={120} className="rounded-lg object-cover border border-border" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-background border border-border text-foreground rounded-full p-1 hover:bg-muted shadow-sm"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 mt-2 border-t border-border">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Dodaj obrazek"
              >
                <ImageIcon size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn("p-2 text-muted-foreground hover:text-foreground transition-colors", showEmojiPicker && "text-primary")}
                title="Emoji"
              >
                <Smile size={18} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
            </div>

            <button
              type="submit"
              disabled={(!text.trim() && !imageFile) || isSubmitting}
              className={cn(
                "bg-primary hover:opacity-90 text-primary-foreground p-2 rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center",
                theme.classes?.button
              )}
              title="Wyślij (Ctrl+Enter)"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </form>

      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-xl overflow-hidden border border-border">
           <EmojiPicker
             onEmojiClick={onEmojiClick}
             theme={Theme.AUTO}
             previewConfig={{ showPreview: false }}
             width={320}
             height={400}
           />
        </div>
      )}
    </div>
  );
};

export default CommentInput;
