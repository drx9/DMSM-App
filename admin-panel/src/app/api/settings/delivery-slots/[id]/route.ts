import { NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        if (!id) {
            return NextResponse.json({ message: 'Delivery slot ID is required' }, { status: 400 });
        }

        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app'}/api/delivery-slots/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return NextResponse.json({ message: 'Delivery slot deleted successfully' });
    } catch (error: any) {
        console.error(`Error deleting delivery slot with ID ${params.id}:`, error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to delete delivery slot' },
            { status: error.response?.status || 500 }
        );
    }
} 