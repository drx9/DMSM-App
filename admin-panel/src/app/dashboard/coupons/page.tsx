'use client'
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'flat' | 'percent';
  discountValue: number;
  maxUses: number;
  remainingUses: number;
  isActive: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/coupons').then(res => {
      setCoupons(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Link href="/dashboard/coupons/new" className="bg-green-600 text-white px-4 py-2 rounded">Add Coupon</Link>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Type</th>
              <th>Value</th>
              <th>Max Uses</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(coupon => (
              <tr key={coupon.id}>
                <td>{coupon.code}</td>
                <td>{coupon.description}</td>
                <td>{coupon.discountType}</td>
                <td>{coupon.discountValue}</td>
                <td>{coupon.maxUses}</td>
                <td>{coupon.remainingUses}</td>
                <td>{coupon.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  <Link href={`/dashboard/coupons/${coupon.id}`} className="text-blue-600">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 