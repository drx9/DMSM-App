'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Order {
    id: string;
    status: string;
    totalAmount: number;
    user: {
        name: string;
        email: string;
        phoneNumber?: string;
        address?: string;
    };
    createdAt: string;
    updatedAt: string;
    orderItems: Array<{
        product: {
            name: string;
            price: number;
            images: string[];
        };
        quantity: number;
    }>;
}

interface OrderDetailsPageProps {
    params: {
        id: string;
    };
}

const orderStatuses = [
    'pending',
    'processing',
    'packed',
    'out_for_delivery',
    'delivered',
    'cancelled',
];

function StatusTimeline({ status }: { status: string }) {
    const steps = [
        { key: 'pending', label: 'Pending' },
        { key: 'processing', label: 'Processing' },
        { key: 'packed', label: 'Packed' },
        { key: 'out_for_delivery', label: 'Out for Delivery' },
        { key: 'delivered', label: 'Delivered' },
        { key: 'cancelled', label: 'Cancelled' },
    ];
    const currentIdx = steps.findIndex(s => s.key === status);
    return (
        <ol className="flex space-x-4 mb-4">
            {steps.map((step, idx) => (
                <li key={step.key} className={`flex-1 text-center ${idx <= currentIdx ? 'text-green-600 font-bold' : 'text-gray-400'}`}>{step.label}</li>
            ))}
        </ol>
    );
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
    const router = useRouter();
    const { id } = params;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/orders/${id}`);
            setOrder(response.data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Failed to load order details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchOrder();
        }
    }, [id]);

    const handleStatusChange = async (newStatus: string) => {
        if (!order) return;

        try {
            setUpdatingStatus(true);
            await axios.put(`/api/orders/${id}`, { status: newStatus });
            toast.success('Order status updated!');
            setOrder({ ...order, status: newStatus }); // Optimistically update UI
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Failed to update order status.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) {
        return <div className="text-center text-gray-500">Loading order details...</div>;
    }

    if (!order) {
        return <div className="text-center text-red-500">Order not found.</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">Order Details #{order.id.substring(0, 8)}</h1>
            <p className="mt-2 text-sm text-gray-700">Order placed on: {new Date(order.createdAt).toLocaleString()}</p>

            <StatusTimeline status={order.status} />

            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {/* Order Status */}
                <div className="bg-white shadow sm:rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
                    <div className="mt-4">
                        <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">Current Status</label>
                        <select
                            id="status"
                            name="status"
                            className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={order.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={updatingStatus}
                        >
                            {orderStatuses.map((status) => (
                                <option key={status} value={status}>
                                    {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white shadow sm:rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
                    <dl className="mt-4 text-sm text-gray-700">
                        <div className="flex justify-between py-2">
                            <dt className="font-medium">Name:</dt>
                            <dd>{order.user.name}</dd>
                        </div>
                        <div className="flex justify-between py-2 border-t border-gray-100">
                            <dt className="font-medium">Email:</dt>
                            <dd>{order.user.email}</dd>
                        </div>
                        {order.user.phoneNumber && (
                            <div className="flex justify-between py-2 border-t border-gray-100">
                                <dt className="font-medium">Phone:</dt>
                                <dd>{order.user.phoneNumber}</dd>
                            </div>
                        )}
                        {order.user.address && (
                            <div className="flex justify-between py-2 border-t border-gray-100">
                                <dt className="font-medium">Address:</dt>
                                <dd>{order.user.address}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Order Summary */}
                <div className="bg-white shadow sm:rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                    <dl className="mt-4 text-sm text-gray-700">
                        <div className="flex justify-between py-2">
                            <dt className="font-medium">Total Items:</dt>
                            <dd>{order.orderItems.reduce((acc, item) => acc + item.quantity, 0)}</dd>
                        </div>
                        <div className="flex justify-between py-2 border-t border-gray-100">
                            <dt className="font-medium">Total Amount:</dt>
                            <dd>₹{order.totalAmount.toLocaleString()}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="mt-8 bg-white shadow sm:rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900">Products in Order</h2>
                <ul role="list" className="divide-y divide-gray-100">
                    {order.orderItems.map((item) => (
                        <li key={item.product.name} className="flex py-6">
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                <img
                                    src={item.product.images[0] || '/placeholder-image.png'}
                                    alt={item.product.name}
                                    className="h-full w-full object-cover object-center"
                                />
                            </div>

                            <div className="ml-4 flex flex-1 flex-col">
                                <div>
                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>
                                            {item.product.name}
                                        </h3>
                                        <p className="ml-4">₹{item.product.price.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex flex-1 items-end justify-between text-sm">
                                    <p className="text-gray-500">Qty {item.quantity}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={() => router.push('/dashboard/orders')}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                    Back to Orders
                </button>
            </div>
        </div>
    );
} 