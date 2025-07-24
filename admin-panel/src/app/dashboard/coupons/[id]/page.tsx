'use client'
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';

export default function EditCouponPage() {
  const { id } = useParams();
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [maxUses, setMaxUses] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get(`/api/coupons/${id}`).then(res => {
      const c = res.data;
      setCode(c.code);
      setDescription(c.description);
      setDiscountType(c.discountType);
      setDiscountValue(c.discountValue);
      setMaxUses(c.maxUses);
      setIsActive(c.isActive);
    });
  }, [id]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await api.put(`/api/coupons/${id}`, {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      isActive,
    });
    router.push('/dashboard/coupons');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Coupon</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Code</label>
          <input className="border w-full" value={code} onChange={e => setCode(e.target.value)} required />
        </div>
        <div>
          <label>Description</label>
          <textarea className="border w-full" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label>Discount Type</label>
          <select className="border w-full" value={discountType} onChange={e => setDiscountType(e.target.value as 'flat' | 'percent')}>
            <option value="flat">Flat</option>
            <option value="percent">Percent</option>
          </select>
        </div>
        <div>
          <label>Discount Value</label>
          <input type="number" className="border w-full" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} required />
        </div>
        <div>
          <label>Max Uses</label>
          <input type="number" className="border w-full" value={maxUses} onChange={e => setMaxUses(Number(e.target.value))} required />
        </div>
        <div>
          <label>Status</label>
          <select className="border w-full" value={isActive ? 'active' : 'inactive'} onChange={e => setIsActive(e.target.value === 'active')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Update Coupon</button>
      </form>
    </div>
  );
} 