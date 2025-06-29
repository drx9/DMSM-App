import { NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Assuming a backend API endpoint for fetching working hours exists
        const response = await axios.get(`${process.env.BACKEND_URL}/api/working-hours`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching working hours:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to fetch working hours' },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        // Assuming a backend API endpoint for updating working hours exists
        const response = await axios.post(`${process.env.BACKEND_URL}/api/working-hours`, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error updating working hours:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to update working hours' },
            { status: error.response?.status || 500 }
        );
    }
} 