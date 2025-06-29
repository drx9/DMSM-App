'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface DeliveryBoy {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
    createdAt: string;
}

interface Metrics {
    totalOrders: number;
    totalKms: number;
    payout: number;
    locations: { shippingAddress: any }[];
}

export default function DeliveryBoysPage() {
    const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', password: '' });
    const [adding, setAdding] = useState(false);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [metricsBoy, setMetricsBoy] = useState<DeliveryBoy | null>(null);
    const [showMetrics, setShowMetrics] = useState(false);

    const fetchDeliveryBoys = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/orders/delivery-boys');
            setDeliveryBoys(res.data);
        } catch {
            toast.error('Failed to load delivery boys');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDeliveryBoys(); }, []);

    const handleAdd = async () => {
        setAdding(true);
        try {
            await api.post('/api/orders/delivery-boys', form);
            toast.success('Delivery boy added');
            setShowAdd(false);
            setForm({ name: '', email: '', phoneNumber: '', password: '' });
            fetchDeliveryBoys();
        } catch {
            toast.error('Failed to add delivery boy');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this delivery boy?')) return;
        try {
            await api.delete(`/api/orders/delivery-boys/${id}`);
            toast.success('Deleted');
            fetchDeliveryBoys();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const openMetrics = async (boy: DeliveryBoy) => {
        setMetricsBoy(boy);
        setShowMetrics(true);
        try {
            const res = await api.get(`/api/orders/delivery-boys/${boy.id}/metrics`);
            setMetrics(res.data);
        } catch {
            toast.error('Failed to load metrics');
            setMetrics(null);
        }
    };

    const statusBadge = (isActive: boolean) => {
        return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-all duration-200 ${isActive
                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {isActive ? 'Active' : 'Inactive'}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
                                Delivery Team
                            </h1>
                            <p className="text-lg text-gray-600 font-medium">
                                Manage your delivery personnel and track their performance
                            </p>
                        </div>
                        <button
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                            onClick={() => setShowAdd(true)}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Delivery Boy
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                            <p className="mt-4 text-lg text-gray-600 font-medium">Loading delivery team...</p>
                        </div>
                    </div>
                ) : deliveryBoys.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No delivery boys found</h3>
                        <p className="text-gray-600 mb-6">Add delivery personnel to start managing your delivery operations.</p>
                        <button
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                            onClick={() => setShowAdd(true)}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add First Delivery Boy
                        </button>
                    </div>
                ) : (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Performance</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {deliveryBoys.map((boy) => (
                                        <tr key={boy.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mr-4">
                                                        <span className="text-white font-bold text-sm">
                                                            {boy.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-semibold text-gray-900">{boy.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{boy.phoneNumber}</div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{boy.email}</div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                {statusBadge(boy.isActive)}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                {new Date(boy.createdAt).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <button
                                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                                                    onClick={() => openMetrics(boy)}
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                    View Metrics
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <button
                                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                                                    onClick={() => handleDelete(boy.id)}
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modern Add Delivery Boy Modal */}
                {showAdd && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md transform transition-all duration-300 scale-100">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Add Delivery Boy</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                        <input
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none"
                                            placeholder="Enter full name"
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                        <input
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none"
                                            placeholder="Enter email address"
                                            type="email"
                                            value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none"
                                            placeholder="Enter phone number"
                                            value={form.phoneNumber}
                                            onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                        <input
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none"
                                            placeholder="Enter password"
                                            type="password"
                                            value={form.password}
                                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 border-2 border-transparent hover:border-gray-300"
                                        onClick={() => setShowAdd(false)}
                                        disabled={adding}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        onClick={handleAdd}
                                        disabled={adding}
                                    >
                                        {adding ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                Adding...
                                            </div>
                                        ) : (
                                            'Add Delivery Boy'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modern Metrics Modal */}
                {showMetrics && metricsBoy && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
                                        <p className="text-gray-600">{metricsBoy.name}</p>
                                    </div>
                                </div>

                                {metrics ? (
                                    <div className="space-y-6">
                                        {/* Stats Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                                <div className="flex items-center">
                                                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-green-600">Orders Delivered</p>
                                                        <p className="text-2xl font-bold text-green-800">{metrics.totalOrders}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                                <div className="flex items-center">
                                                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-600">Total Distance</p>
                                                        <p className="text-2xl font-bold text-blue-800">{metrics.totalKms} KM</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                                                <div className="flex items-center">
                                                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-orange-600">Total Payout</p>
                                                        <p className="text-2xl font-bold text-orange-800">₹{metrics.payout.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delivery Locations */}
                                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Delivery Locations ({metrics.locations.length})
                                            </h3>
                                            <div className="max-h-64 overflow-y-auto space-y-2">
                                                {metrics.locations.map((loc, i) => (
                                                    <div key={i} className="bg-white rounded-lg p-3 border border-gray-200 text-sm">
                                                        <div className="font-medium text-gray-900">Location #{i + 1}</div>
                                                        <div className="text-gray-600 mt-1 font-mono text-xs">
                                                            {JSON.stringify(loc.shippingAddress, null, 2)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                                            <p className="mt-4 text-gray-600 font-medium">Loading metrics...</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end mt-8">
                                    <button
                                        className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 border-2 border-transparent hover:border-gray-300"
                                        onClick={() => setShowMetrics(false)}
                                    >
                                        Close
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