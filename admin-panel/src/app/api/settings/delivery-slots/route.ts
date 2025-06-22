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

        const response = await axios.get(`${process.env.BACKEND_URL}/api/delivery-slots`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching delivery slots:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to fetch delivery slots' },
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
        const response = await axios.post(`${process.env.BACKEND_URL}/api/delivery-slots`, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error adding delivery slot:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to add delivery slot' },
            { status: error.response?.status || 500 }
        );
    }
} 