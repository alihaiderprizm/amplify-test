import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCartsItemCount } from '@/db/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const result = await getCartsItemCount(session.user.id)
    // console.log("result", result)



    return NextResponse.json({ count: result.count });
  } catch (error) {
    console.error('Error getting cart count:', error);
    return NextResponse.json({ count: 0 });
  }
} 