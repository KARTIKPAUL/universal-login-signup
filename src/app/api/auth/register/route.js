import { signupSchema } from '@/app/lib/validations';
import { NextResponse } from 'next/server';
import User from '../../../../../models/User';
import dbConnect from '@/app/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedFields = signupSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Invalid fields', details: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedFields.data;

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      provider: 'credentials',
      isEmailVerified: true // For simplicity, assuming email is verified
    });

    return NextResponse.json(
      { message: 'User created successfully', userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}