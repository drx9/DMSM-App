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

        const response = await axios.get(`${process.env.BACKEND_URL}/api/serviceable-pincodes`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching serviceable pincodes:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to fetch serviceable pincodes' },
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
        const response = await axios.post(`${process.env.BACKEND_URL}/api/serviceable-pincodes`, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error adding serviceable pincode:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to add serviceable pincode' },
            { status: error.response?.status || 500 }
        );
    }
} 