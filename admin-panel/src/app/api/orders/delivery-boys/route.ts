import { NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('admin_token')?.value;

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app'}/api/orders/delivery-boys`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to fetch delivery boys' },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const cookieStore = cookies();
        const token = cookieStore.get('admin_token')?.value;

        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app'}/api/orders/delivery-boys`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to add delivery boy' },
            { status: error.response?.status || 500 }
        );
    }
} 