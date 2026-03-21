import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parentId');
  const cursor = searchParams.get('cursor') || undefined;
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!parentId) {
    return NextResponse.json({ success: false, message: 'parentId is required' }, { status: 400 });
  }

  try {
    const replies = await prisma.comment.findMany({
        where: { parentId },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'asc' },
        include: {
            author: {
                select: { id: true, username: true, displayName: true, avatar: true, role: true }
            },
            _count: {
                select: { likes: true, replies: true }
            }
        }
    });

    const repliesWithLiked = await Promise.all(replies.map(async (r) => {
        const isLiked = currentUserId ? !!(await prisma.commentLike.findUnique({
            where: { userId_commentId: { userId: currentUserId, commentId: r.id } }
        })) : false;
        return { ...r, isLiked };
    }));

    const nextCursor = replies.length === limit ? replies[limit - 1].id : null;
    return NextResponse.json({ success: true, replies: repliesWithLiked, nextCursor });
  } catch (error) {
    console.error(`Error fetching replies for parentId ${parentId}:`, error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
