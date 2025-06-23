'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import {
    UserGroupIcon,
    ShoppingBagIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/outline';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/api/dashboard/stats');
                setStats(res.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-bounce"></div>
                        <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="text-gray-600 font-medium">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const chartData = {
        labels: stats.ordersPerDay.map((d: any) => d.date),
        datasets: [
            {
                label: 'Orders per Day',
                data: stats.ordersPerDay.map((d: any) => d.count),
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 12,
                        family: 'Inter, system-ui, sans-serif',
                    },
                },
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    borderDash: [2, 2],
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 12,
                        family: 'Inter, system-ui, sans-serif',
                    },
                },
            },
        },
    };

    const statCards = [
        {
            title: 'Total Customers',
            value: stats.totalCustomers,
            icon: UserGroupIcon,
            gradient: 'from-purple-500 to-purple-600',
            shadow: 'shadow-purple-500/25',
            bgGradient: 'from-purple-50 to-purple-100',
            change: '+12%',
            changeType: 'positive',
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders,
            icon: ShoppingBagIcon,
            gradient: 'from-blue-500 to-blue-600',
            shadow: 'shadow-blue-500/25',
            bgGradient: 'from-blue-50 to-blue-100',
            change: '+23%',
            changeType: 'positive',
        },
        {
            title: 'Total Revenue',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: CurrencyDollarIcon,
            gradient: 'from-green-500 to-green-600',
            shadow: 'shadow-green-500/25',
            bgGradient: 'from-green-50 to-green-100',
            change: '+18%',
            changeType: 'positive',
        },
        {
            title: 'Low Stock Items',
            value: stats.lowStockItems.length,
            icon: ExclamationTriangleIcon,
            gradient: 'from-orange-500 to-orange-600',
            shadow: 'shadow-orange-500/25',
            bgGradient: 'from-orange-50 to-orange-100',
            change: '+5%',
            changeType: 'warning',
        },
    ];

    return (
        <div className="space-y-8 bg-gradient-to-br from-gray-50 to-white min-h-screen p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                        Dashboard Analytics
                    </h1>
                    <p className="text-gray-600 mt-2 flex items-center space-x-2">
                        <CalendarDaysIcon className="w-4 h-4" />
                        <span>Real-time business insights</span>
                    </p>
                </div>
                <div className="hidden sm:flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <div
                        key={card.title}
                        className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-gray-200"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Background Decoration */}
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.bgGradient} rounded-full transform translate-x-8 -translate-y-8 opacity-30`}></div>

                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${card.gradient} shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                    <card.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${card.changeType === 'positive'
                                    ? 'bg-green-100 text-green-800'
                                    : card.changeType === 'warning'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {card.changeType === 'positive' ? '↗' : card.changeType === 'warning' ? '⚠' : '↘'} {card.change}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                                    {card.title}
                                </p>
                                <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    {card.value}
                                </p>
                            </div>
                        </div>

                        {/* Hover Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%]"></div>
                    </div>
                ))}
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/25">
                            <ChartBarIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Orders Performance</h2>
                            <p className="text-sm text-gray-600">Last 7 days trend analysis</p>
                        </div>
                    </div>
                    <div className="hidden sm:block bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1 rounded-full">
                        <span className="text-green-700 text-sm font-medium">7 Days</span>
                    </div>
                </div>
                <div className="h-80">
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </div>

            {/* Low Stock Items Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/25">
                            <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Low Stock Alert</h2>
                            <p className="text-sm text-gray-600">Items requiring immediate attention</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 px-3 py-1 rounded-full">
                        <span className="text-orange-700 text-sm font-medium">{stats.lowStockItems.length} Items</span>
                    </div>
                </div>

                {stats.lowStockItems.length > 0 ? (
                    <div className="grid gap-3">
                        {stats.lowStockItems.map((item: any, index: number) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-200"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">!</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-sm text-gray-600">Product ID: {item.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-orange-600">{item.stock}</p>
                                    <p className="text-xs text-gray-500">units left</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">All Stock Levels Healthy</h3>
                        <p className="text-gray-600">No items are currently running low on stock</p>
                    </div>
                )}
            </div>
        </div>
    );
}