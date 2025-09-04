import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/app/lib/auth';
import { setPasswordSchema } from '@/app/lib/validations';
import User from '../../../../../models/User';
import dbConnect from '@/app/lib/mongodb';


export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedFields = setPasswordSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Invalid fields', details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { password } = validatedFields.data;

    await dbConnect();

    // Update user password
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    user.password = password;
    user.needsPasswordSetup = false;
    await user.save();

    return NextResponse.json(
      { message: 'Password set successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}