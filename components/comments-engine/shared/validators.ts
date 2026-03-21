import { z } from 'zod';

export const CommentAuthorSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  displayName: z.string().nullable(),
  avatar: z.string().nullable(),
  role: z.string(),
});

export const BaseCommentSchema = z.object({
  id: z.string(),
  text: z.string(),
  imageUrl: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  authorId: z.string(),
  parentId: z.string().nullable().optional(),
  author: CommentAuthorSchema,
  isLiked: z.boolean().default(false),
  _count: z.object({
    likes: z.number().default(0),
    replies: z.number().default(0),
  }).optional(),
});

export type Comment = z.infer<typeof BaseCommentSchema> & {
  replies?: Comment[];
  parentAuthorId?: string | null;
  parentAuthorUsername?: string | null;
};

export const CommentSchema: z.ZodType<Comment> = z.lazy(() =>
  BaseCommentSchema.extend({
    replies: z.array(z.lazy(() => CommentSchema)).optional(),
    parentAuthorId: z.string().nullable().optional(),
    parentAuthorUsername: z.string().nullable().optional(),
  }) as z.ZodType<Comment>
);
