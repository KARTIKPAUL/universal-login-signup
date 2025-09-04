import dbConnect from '@/app/lib/mongodb';
import { NextResponse } from 'next/server';
import User from '../../../../../models/User';


export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email });

    return NextResponse.json({
      exists: !!user,
      needsPasswordSetup: user?.needsPasswordSetup || false,
      provider: user?.provider || null
    });
  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}