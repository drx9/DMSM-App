'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Order {
    id: string;
    status: string;
    totalAmount: number;
    customer: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    items: Array<{
        product: {
            id: string;
            name: string;
            price: number;
        };
        quantity: number;
        price: number;
    }>;
    deliveryBoyId?: string;
}

interface DeliveryBoy {
    id: string;
    name: string;
    phoneNumber: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
    const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState<string>('');
    const [assigning, setAssigning] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/orders');
            // Map deliveryBoyId from backend response if present
            const mappedOrders = response.data.orders.map((order: any) => ({
                ...order,
                deliveryBoyId: order.deliveryBoyId || order.delivery_boy_id || undefined,
            }));
            setOrders(mappedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDeliveryBoys = async () => {
        try {
            const response = await api.get('/api/orders/delivery-boys');
            setDeliveryBoys(response.data);
        } catch (error) {
            toast.error('Failed to load delivery boys');
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const openAssignModal = (orderId: string) => {
        setSelectedOrderId(orderId);
        setShowModal(true);
        setSelectedDeliveryBoy('');
        fetchDeliveryBoys();
    };

    const handleAssign = async () => {
        if (!selectedOrderId || !selectedDeliveryBoy) return;
        setAssigning(true);
        try {
            await api.put(`/api/orders/${selectedOrderId}/assign-delivery`, { deliveryBoyId: selectedDeliveryBoy });
            toast.success('Delivery boy assigned!');
            setShowModal(false);
            fetchOrders();
        } catch (error: any) {
            if (error?.response?.data?.message?.includes('undelivered orders')) {
                toast.error('This delivery boy already has undelivered orders. Complete them before assigning new ones.');
            } else {
                toast.error('Failed to assign delivery boy');
            }
        } finally {
            setAssigning(false);
        }
    };

    const handleBulkAssign = async () => {
        if (!selectedDeliveryBoy || selectedOrders.length === 0) return;
        setAssigning(true);
        try {
            await api.put('/api/orders/assign-delivery-bulk', {
                orderIds: selectedOrders,
                deliveryBoyId: selectedDeliveryBoy,
            });
            toast.success('Delivery boy assigned to selected orders!');
            setShowModal(false);
            setSelectedOrders([]);
            fetchOrders();
        } catch (error: any) {
            if (error?.response?.data?.message?.includes('undelivered orders')) {
                toast.error('This delivery boy already has undelivered orders. Complete them before assigning new ones.');
            } else {
                toast.error('Failed to assign delivery boy to selected orders');
            }
        } finally {
            setAssigning(false);
        }
    };

    const statusBadge = (status: string) => {
        let color = '';
        let text = status.charAt(0).toUpperCase() + status.slice(1);
        switch (status) {
            case 'pending':
                color = 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200';
                break;
            case 'processing':
                color = 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200';
                break;
            case 'shipped':
                color = 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200';
                break;
            case 'delivered':
                color = 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200';
                break;
            case 'cancelled':
                color = 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200';
                break;
            default:
                color = 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200';
        }
        return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-all duration-200 ${color}`}>
                {text}
            </span>
        );
    };

    const handleSelectOrder = (orderId: string) => {
        setSelectedOrders(prev =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedOrders([]);
            setSelectAll(false);
        } else {
            setSelectedOrders(orders.map(order => order.id));
            setSelectAll(true);
        }
    };

    useEffect(() => {
        if (selectedOrders.length === orders.length && orders.length > 0) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedOrders, orders]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 mb-8">
                    <div className="sm:flex sm:items-center">
                        <div className="sm:flex-auto">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
                                Orders Management
                            </h1>
                            <p className="text-lg text-gray-600 font-medium">
                                Manage and track all customer orders efficiently
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bulk Assign Button */}
                <div className="flex items-center mb-4">
                    <button
                        className={`inline-flex items-center px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mr-4`}
                        disabled={selectedOrders.length === 0}
                        onClick={() => {
                            setShowModal(true);
                            setSelectedOrderId(null); // Not single order
                            setSelectedDeliveryBoy('');
                            fetchDeliveryBoys();
                        }}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h4a1 1 0 011 1v2a1 1 0 01-1 1h-4v8a1 1 0 01-1 1H9a1 1 0 01-1-1v-8H4a1 1 0 01-1-1V8a1 1 0 011-1h4z" />
                        </svg>
                        Assign Delivery Boy to Selected
                    </button>
                    <span className="text-gray-500 text-sm">{selectedOrders.length} selected</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                            <p className="mt-4 text-lg text-gray-600 font-medium">Loading orders...</p>
                        </div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
                        <p className="text-gray-600">Orders will appear here once customers start placing them.</p>
                    </div>
                ) : (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={handleSelectAll}
                                                aria-label="Select all orders"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Total Amount</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Order Date</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Delivery</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order, index) => (
                                        <tr key={order.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 group">
                                            <td className="px-4 py-5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOrders.includes(order.id)}
                                                    onChange={() => handleSelectOrder(order.id)}
                                                    aria-label={`Select order ${order.id}`}
                                                />
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded-lg inline-block">
                                                    {order.id.substring(0, 8)}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-semibold text-gray-900">{order.customer?.name}</div>
                                                    <div className="text-sm text-gray-500">{order.customer?.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-lg font-bold text-green-600">
                                                    ₹{order.totalAmount.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                {statusBadge(order.status)}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <Link
                                                    href={`/dashboard/orders/${order.id}`}
                                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View Details
                                                </Link>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                {order.status === 'pending' ? (
                                                    <button
                                                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                                                        onClick={() => openAssignModal(order.id)}
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h4a1 1 0 011 1v2a1 1 0 01-1 1h-4v8a1 1 0 01-1 1H9a1 1 0 01-1-1v-8H4a1 1 0 01-1-1V8a1 1 0 011-1h4z" />
                                                        </svg>
                                                        Send for Delivery
                                                    </button>
                                                ) : order.deliveryBoyId ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Assigned
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-medium">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modern Modal for assigning delivery boy */}
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md transform transition-all duration-300 scale-100">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Assign Delivery Boy</h2>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Select Delivery Personnel</label>
                                    <select
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none"
                                        value={selectedDeliveryBoy}
                                        onChange={e => setSelectedDeliveryBoy(e.target.value)}
                                    >
                                        <option value="">Choose a delivery boy...</option>
                                        {deliveryBoys.map(boy => (
                                            <option key={boy.id} value={boy.id}>
                                                {boy.name} ({boy.phoneNumber})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 border-2 border-transparent hover:border-gray-300"
                                        onClick={() => setShowModal(false)}
                                        disabled={assigning}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        onClick={selectedOrderId ? handleAssign : handleBulkAssign}
                                        disabled={!selectedDeliveryBoy || assigning}
                                    >
                                        {assigning ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                Assigning...
                                            </div>
                                        ) : (
                                            'Assign Now'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}