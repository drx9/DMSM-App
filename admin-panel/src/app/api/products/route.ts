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

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app'}/api/products`, {
            headers: { 'Content-Type': 'application/json' },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to fetch products' },
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
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app'}/api/products`, body, {
            headers: { 'Content-Type': 'application/json' },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to create product' },
            { status: error.response?.status || 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
        }

        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app'}/api/products/${id}`);

        return NextResponse.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to delete product' },
            { status: error.response?.status || 500 }
        );
    }
} 