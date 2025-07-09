import { NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app'}/api/products/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error(`Error fetching product with ID ${params.id}:`, error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to fetch product' },
            { status: error.response?.status || 500 }
        );
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();

        const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app'}/api/products/${id}`, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error(`Error updating product with ID ${params.id}:`, error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to update product' },
            { status: error.response?.status || 500 }
        );
    }
} 