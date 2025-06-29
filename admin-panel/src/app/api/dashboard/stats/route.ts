import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
    try {
        // Fetch data from backend
        const [ordersResponse, productsResponse, usersResponse] = await Promise.all([
            axios.get(`${process.env.BACKEND_URL}/api/orders/stats`),
            axios.get(`${process.env.BACKEND_URL}/api/products/stats`),
            axios.get(`${process.env.BACKEND_URL}/api/users/stats`),
        ]);

        const { totalRevenue, totalOrders } = ordersResponse.data;
        const { lowStockItems } = productsResponse.data;
        const { totalCustomers } = usersResponse.data;

        return NextResponse.json({
            totalRevenue,
            totalOrders,
            totalCustomers,
            lowStockItems,
        });
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { message: error.response?.data?.message || 'Failed to fetch dashboard stats' },
            { status: error.response?.status || 500 }
        );
    }
} 