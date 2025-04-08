import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pool } from '@/db/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const result = await pool.query(
      `SELECT COALESCE(SUM(quantity), 0) as count
       FROM cart_items
       WHERE cart_id IN (
         SELECT id FROM carts WHERE user_id = $1
       )`,
      [session.user.id]
    );

    return NextResponse.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error getting cart count:', error);
    return NextResponse.json({ count: 0 });
  }
} 