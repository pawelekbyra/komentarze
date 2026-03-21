import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { sanitize } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rate-limiter';
import { ably } from '@/lib/ably-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slideId = searchParams.get('slideId');
  const cursor = searchParams.get('cursor') || undefined;
  const sortBy = searchParams.get('sortBy') as 'newest' | 'top' | undefined;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!slideId) {
    return NextResponse.json({ success: false, message: 'slideId is required' }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { slideId, parentId: null },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: sortBy === 'top' ? { likes: { _count: 'desc' } } : { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true, role: true }
        },
        _count: {
          select: { likes: true, replies: true }
        }
      }
    });

    const commentsWithLiked = await Promise.all(comments.map(async (c) => {
        const isLiked = currentUserId ? !!(await prisma.commentLike.findUnique({
            where: { userId_commentId: { userId: currentUserId, commentId: c.id } }
        })) : false;
        return { ...c, isLiked };
    }));

    const nextCursor = comments.length === limit ? comments[limit - 1].id : null;
    return NextResponse.json({ success: true, comments: commentsWithLiked, nextCursor });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ success: false, message: 'Authentication required to comment.' }, { status: 401 });
  }
  const currentUser = session.user;

  const { success } = await rateLimit(`comment:${currentUser.id}`, 3, 30);
  if (!success) {
    return NextResponse.json({ success: false, message: 'commentRateLimit' }, { status: 429 });
  }

  try {
    const { slideId, text, parentId, imageUrl } = await request.json();

    if (!slideId || (!text && !imageUrl)) {
      return NextResponse.json({ success: false, message: 'slideId and text or imageUrl are required' }, { status: 400 });
    }

    const sanitizedText = sanitize(text?.trim() || '');

    const newComment = await prisma.comment.create({
        data: {
            slideId,
            text: sanitizedText,
            authorId: currentUser.id!,
            parentId: parentId || null,
            imageUrl: imageUrl || null,
        },
        include: {
            author: {
                select: { id: true, username: true, displayName: true, avatar: true, role: true }
            },
            _count: {
                select: { likes: true, replies: true }
            }
        }
    });

    const channel = ably.channels.get(`comments:${slideId}`);
    await channel.publish('new-comment', newComment);

    return NextResponse.json({ success: true, comment: { ...newComment, isLiked: false } }, { status: 201 });
  } catch (error: any) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
    }
    const currentUser = session.user;

    try {
      const { commentId } = await request.json();
      if (!commentId) return NextResponse.json({ success: false, message: 'commentId is required' }, { status: 400 });

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true }
      });

      if (!comment) return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });
      if (comment.authorId !== currentUser.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });

      await prisma.comment.delete({ where: { id: commentId } });
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
  }
