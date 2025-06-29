import { NextResponse } from 'next/server';
import axios from 'axios';
import { SignJWT } from 'jose';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Call backend login API
        const response = await axios.post(`${process.env.BACKEND_URL}/api/auth/login`, { email, password });

        const { user } = response.data;

        // Verify if user is admin
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        // Create JWT token
        const token = await new SignJWT({ id: user.id, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(new TextEncoder().encode(process.env.JWT_SECRET));

        return NextResponse.json({ token });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Login failed' },
            { status: error.response?.status || 500 }
        );
    }
} 