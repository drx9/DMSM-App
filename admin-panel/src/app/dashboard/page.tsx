'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
    CurrencyDollarIcon,
    ShoppingBagIcon,
    UserGroupIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const stats = [
    {
        name: 'Total Revenue',
        value: '₹0',
        icon: CurrencyDollarIcon,
        change: '+4.75%',
        changeType: 'positive',
    },
    {
        name: 'Total Orders',
        value: '0',
        icon: ShoppingBagIcon,
        change: '+54.02%',
        changeType: 'positive',
    },
    {
        name: 'Total Customers',
        value: '0',
        icon: UserGroupIcon,
        change: '-1.39%',
        changeType: 'negative',
    },
    {
        name: 'Low Stock Items',
        value: '0',
        icon: ExclamationTriangleIcon,
        change: '+10.18%',
        changeType: 'negative',
    },
];

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        lowStockItems: 0,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/api/dashboard/stats');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

            <div className="mt-8">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((item) => (
                        <div
                            key={item.name}
                            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
                        >
                            <dt>
                                <div className="absolute rounded-md bg-indigo-500 p-3">
                                    <item.icon
                                        className="h-6 w-6 text-white"
                                        aria-hidden="true"
                                    />
                                </div>
                                <p className="ml-16 truncate text-sm font-medium text-gray-500">
                                    {item.name}
                                </p>
                            </dt>
                            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                                <p className="text-2xl font-semibold text-gray-900">
                                    {loading ? (
                                        <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
                                    ) : (
                                        item.name === 'Total Revenue'
                                            ? `₹${data.totalRevenue.toLocaleString()}`
                                            : item.name === 'Total Orders'
                                                ? data.totalOrders.toLocaleString()
                                                : item.name === 'Total Customers'
                                                    ? data.totalCustomers.toLocaleString()
                                                    : data.lowStockItems.toLocaleString()
                                    )}
                                </p>
                                <p
                                    className={`ml-2 flex items-baseline text-sm font-semibold ${item.changeType === 'positive'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                        }`}
                                >
                                    {item.change}
                                </p>
                            </dd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 