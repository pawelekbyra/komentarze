import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }
  const userId = session.user.id!;

  try {
    const { commentId } = await request.json();
    if (!commentId || typeof commentId !== 'string') {
      return NextResponse.json({ success: false, message: 'commentId is required' }, { status: 400 });
    }

    const existingLike = await prisma.commentLike.findUnique({
        where: { userId_commentId: { userId, commentId } }
    });

    if (existingLike) {
        await prisma.commentLike.delete({ where: { id: existingLike.id } });
    } else {
        await prisma.commentLike.create({ data: { userId, commentId } });
    }

    const likeCount = await prisma.commentLike.count({ where: { commentId } });

    return NextResponse.json({
      success: true,
      isLiked: !existingLike,
      likeCount,
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
