'use client'
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Offer {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    products: Array<{ id: string; name: string }>;
}

export default function OffersPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/offers').then(res => {
            setOffers(res.data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Offers</h1>
                <Link href="/dashboard/offers/new" className="bg-green-600 text-white px-4 py-2 rounded">Add Offer</Link>
            </div>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <table className="w-full border">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Status</th>
                            <th>Products</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offers.map(offer => (
                            <tr key={offer.id}>
                                <td>{offer.name}</td>
                                <td>{offer.description}</td>
                                <td>{offer.startDate?.slice(0, 10)}</td>
                                <td>{offer.endDate?.slice(0, 10)}</td>
                                <td>{offer.isActive ? 'Active' : 'Inactive'}</td>
                                <td>{offer.products?.map(p => p.name).join(', ')}</td>
                                <td>
                                    <Link href={`/dashboard/offers/${offer.id}`} className="text-blue-600">Edit</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
} 