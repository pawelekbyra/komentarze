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
      addToast?.(t('commentPostError'), 'error');
    }
  };

  if (!userProfile) {
    return (
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-center">
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
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-100 rounded-t-lg text-xs font-bold text-slate-500">
          <span>{t('replyingTo', { user: replyingToUser })}</span>
          <button onClick={onCancelReply}><X size={14} /></button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex gap-3 items-start p-4 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all focus-within:shadow-md focus-within:border-primary/30",
          replyingToUser && "rounded-t-none border-t-0"
        )}
      >
        <Image
          src={userProfile.avatar || '/default-avatar.png'}
          alt={t('yourAvatar')}
          width={40}
          height={40}
          className="rounded-full border border-slate-100 shrink-0"
        />

        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyingToUser ? t('replyTo', { user: replyingToUser }) : t('addCommentPlaceholder')}
            className={cn(
              "w-full bg-transparent text-slate-900 focus:outline-none text-sm resize-none min-h-[40px] max-h-[200px] py-2",
              theme.fontSerif
            )}
            disabled={isSubmitting}
          />

          {imagePreview && (
            <div className="relative inline-block mt-2">
              <Image src={imagePreview} alt="Preview" width={100} height={100} className="rounded-lg object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ImageIcon size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn("p-2 text-slate-400 hover:text-slate-600 transition-colors", showEmojiPicker && "text-primary")}
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
                "bg-primary hover:bg-primary/90 text-white p-2 rounded-xl transition-all active:scale-95 disabled:opacity-50",
                theme.classes?.button
              )}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowUp size={18} strokeWidth={3} />
              )}
            </button>
          </div>
        </div>
      </form>

      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-50">
           <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.LIGHT} previewConfig={{ showPreview: false }} />
        </div>
      )}
    </div>
  );
};

export default CommentInput;
