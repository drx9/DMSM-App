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

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app'}/api/orders`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to fetch orders' },
            { status: error.response?.status || 500 }
        );
    }
} 