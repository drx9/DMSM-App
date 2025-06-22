'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface WorkingHours {
    id?: string;
    dayOfWeek: string;
    openingTime: string;
    closingTime: string;
    isClosed: boolean;
}

const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

export default function WorkingHoursPage() {
    const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchWorkingHours = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/settings/working-hours');
                const fetchedHours: WorkingHours[] = response.data;

                // Initialize with default values if no data from backend
                const initialHours = daysOfWeek.map((day) => {
                    const existing = fetchedHours.find((hour) => hour.dayOfWeek === day);
                    return existing
                        ? existing
                        : {
                            dayOfWeek: day,
                            openingTime: '09:00',
                            closingTime: '18:00',
                            isClosed: false,
                        };
                });
                setWorkingHours(initialHours);
            } catch (error) {
                console.error('Error fetching working hours:', error);
                toast.error('Failed to load working hours.');
            } finally {
                setLoading(false);
            }
        };

        fetchWorkingHours();
    }, []);

    const handleTimeChange = (day: string, type: 'opening' | 'closing', value: string) => {
        setWorkingHours((prevHours) =>
            prevHours.map((hour) =>
                hour.dayOfWeek === day
                    ? {
                        ...hour,
                        [type === 'opening' ? 'openingTime' : 'closingTime']: value,
                    }
                    : hour
            )
        );
    };

    const handleIsClosedChange = (day: string, checked: boolean) => {
        setWorkingHours((prevHours) =>
            prevHours.map((hour) =>
                hour.dayOfWeek === day
                    ? {
                        ...hour,
                        isClosed: checked,
                        openingTime: checked ? '' : '09:00', // Clear times if closed
                        closingTime: checked ? '' : '18:00', // Clear times if closed
                    }
                    : hour
            )
        );
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await axios.post('/api/settings/working-hours', workingHours);
            toast.success('Working hours updated successfully!');
        } catch (error) {
            console.error('Error saving working hours:', error);
            toast.error('Failed to save working hours.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center text-gray-500">Loading working hours...</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">Store Working Hours</h1>
            <p className="mt-2 text-sm text-gray-700">
                Set the daily opening and closing times for your store.
            </p>

            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th
                                        scope="col"
                                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                                    >
                                        Day
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                    >
                                        Opening Time
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                    >
                                        Closing Time
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                    >
                                        Closed All Day
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {workingHours.map((hour) => (
                                    <tr key={hour.dayOfWeek}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                            {hour.dayOfWeek}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <input
                                                type="time"
                                                value={hour.openingTime}
                                                onChange={(e) => handleTimeChange(hour.dayOfWeek, 'opening', e.target.value)}
                                                disabled={hour.isClosed}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <input
                                                type="time"
                                                value={hour.closingTime}
                                                onChange={(e) => handleTimeChange(hour.dayOfWeek, 'closing', e.target.value)}
                                                disabled={hour.isClosed}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <input
                                                type="checkbox"
                                                checked={hour.isClosed}
                                                onChange={(e) => handleIsClosedChange(hour.dayOfWeek, e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Working Hours'}
                </button>
            </div>
        </div>
    );
} 