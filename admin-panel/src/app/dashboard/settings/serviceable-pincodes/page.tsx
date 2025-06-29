'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Pincode {
    id: string;
    pincode: string;
    isActive: boolean;
}

export default function ServiceablePincodesPage() {
    const [pincodes, setPincodes] = useState<Pincode[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPincode, setNewPincode] = useState('');

    const fetchPincodes = async () => {
        try {
            setLoading(true);
            // Assuming a backend API endpoint for serviceable pincodes exists
            const response = await axios.get('/api/settings/serviceable-pincodes');
            setPincodes(response.data);
        } catch (error) {
            console.error('Error fetching serviceable pincodes:', error);
            toast.error('Failed to load serviceable pincodes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPincodes();
    }, []);

    const handleAddPincode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPincode.trim()) {
            toast.error('Pincode cannot be empty.');
            return;
        }
        try {
            const response = await axios.post('/api/settings/serviceable-pincodes', {
                pincode: newPincode.trim(),
            });
            toast.success('Pincode added successfully!');
            setNewPincode('');
            fetchPincodes();
        } catch (error) {
            console.error('Error adding pincode:', error);
            toast.error('Failed to add pincode.');
        }
    };

    const handleDeletePincode = async (id: string) => {
        if (!confirm('Are you sure you want to delete this pincode?')) return;
        try {
            await axios.delete(`/api/settings/serviceable-pincodes/${id}`);
            toast.success('Pincode deleted successfully!');
            fetchPincodes();
        } catch (error) {
            console.error('Error deleting pincode:', error);
            toast.error('Failed to delete pincode.');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">Serviceable Pin Codes</h1>
            <p className="mt-2 text-sm text-gray-700">
                Manage the geographical areas where your service is available.
            </p>

            <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900">Add New Pincode</h2>
                <form onSubmit={handleAddPincode} className="mt-4 flex gap-x-3">
                    <input
                        type="text"
                        name="pincode"
                        id="pincode"
                        value={newPincode}
                        onChange={(e) => setNewPincode(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="Enter pincode"
                        required
                    />
                    <button
                        type="submit"
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <PlusCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Add Pincode
                    </button>
                </form>
            </div>

            <div className="mt-10">
                <h2 className="text-xl font-semibold text-gray-900">Existing Serviceable Pincodes</h2>
                {loading ? (
                    <div className="mt-4 text-center text-gray-500">Loading pincodes...</div>
                ) : pincodes.length === 0 ? (
                    <div className="mt-4 text-center text-gray-500">No serviceable pincodes configured yet.</div>
                ) : (
                    <div className="mt-4 flow-root">
                        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead>
                                        <tr>
                                            <th
                                                scope="col"
                                                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                                            >
                                                Pincode
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            >
                                                Status
                                            </th>
                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {pincodes.map((pincode) => (
                                            <tr key={pincode.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                                    {pincode.pincode}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${pincode.isActive
                                                                ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                                : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                                                            }`}
                                                    >
                                                        {pincode.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                    <button
                                                        onClick={() => handleDeletePincode(pincode.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <TrashIcon className="h-5 w-5 inline mr-2" aria-hidden="true" />
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 