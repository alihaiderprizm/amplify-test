import { NextResponse } from 'next/server';
import { pool } from '@/db/db';

export async function GET() {
  try {
    // Test the connection
    const client = await pool.connect();
    
    // Run a simple query
    const result = await client.query('SELECT NOW()');
    console.log("resultresultresult",result)
    client.release();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 