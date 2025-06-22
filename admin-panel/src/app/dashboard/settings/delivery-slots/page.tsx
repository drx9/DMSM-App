'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DeliverySlot {
    id: string;
    startTime: string;
    endTime: string;
    capacity: number;
    isActive: boolean;
}

export default function DeliverySlotsPage() {
    const [slots, setSlots] = useState<DeliverySlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [newSlot, setNewSlot] = useState({
        startTime: '',
        endTime: '',
        capacity: 0,
    });

    const fetchDeliverySlots = async () => {
        try {
            setLoading(true);
            // Assuming a backend API endpoint for delivery slots exists
            const response = await axios.get('/api/settings/delivery-slots');
            setSlots(response.data);
        } catch (error) {
            console.error('Error fetching delivery slots:', error);
            toast.error('Failed to load delivery slots.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliverySlots();
    }, []);

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/settings/delivery-slots', {
                ...newSlot,
                capacity: Number(newSlot.capacity),
            });
            toast.success('Delivery slot added successfully!');
            setNewSlot({ startTime: '', endTime: '', capacity: 0 });
            fetchDeliverySlots();
        } catch (error) {
            console.error('Error adding delivery slot:', error);
            toast.error('Failed to add delivery slot.');
        }
    };

    const handleDeleteSlot = async (id: string) => {
        if (!confirm('Are you sure you want to delete this delivery slot?')) return;
        try {
            await axios.delete(`/api/settings/delivery-slots/${id}`);
            toast.success('Delivery slot deleted successfully!');
            fetchDeliverySlots();
        } catch (error) {
            console.error('Error deleting delivery slot:', error);
            toast.error('Failed to delete delivery slot.');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">Delivery Slots</h1>
            <p className="mt-2 text-sm text-gray-700">
                Manage available delivery time slots for your store.
            </p>

            <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900">Add New Slot</h2>
                <form onSubmit={handleAddSlot} className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-8">
                    <div>
                        <label htmlFor="startTime" className="block text-sm font-medium leading-6 text-gray-900">
                            Start Time
                        </label>
                        <input
                            type="time"
                            id="startTime"
                            value={newSlot.startTime}
                            onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                            required
                            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                    </div>
                    <div>
                        <label htmlFor="endTime" className="block text-sm font-medium leading-6 text-gray-900">
                            End Time
                        </label>
                        <input
                            type="time"
                            id="endTime"
                            value={newSlot.endTime}
                            onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                            required
                            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                    </div>
                    <div>
                        <label htmlFor="capacity" className="block text-sm font-medium leading-6 text-gray-900">
                            Capacity
                        </label>
                        <input
                            type="number"
                            id="capacity"
                            value={newSlot.capacity}
                            onChange={(e) => setNewSlot({ ...newSlot, capacity: Number(e.target.value) })}
                            required
                            min="0"
                            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                    </div>
                    <div className="sm:col-span-3 flex justify-end">
                        <button
                            type="submit"
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <PlusCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Add Slot
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-10">
                <h2 className="text-xl font-semibold text-gray-900">Existing Delivery Slots</h2>
                {loading ? (
                    <div className="mt-4 text-center text-gray-500">Loading slots...</div>
                ) : slots.length === 0 ? (
                    <div className="mt-4 text-center text-gray-500">No delivery slots configured yet.</div>
                ) : (
                    <div className="mt-4 flow-root">
                        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead>
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                                Time Slot
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Capacity
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Status
                                            </th>
                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {slots.map((slot) => (
                                            <tr key={slot.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                                    {slot.startTime} - {slot.endTime}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {slot.capacity}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${slot.isActive
                                                                ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                                : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                                                            }`}
                                                    >
                                                        {slot.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
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