import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';

interface Product {
    id: string;
    name: string;
}

export default function EditOfferPage() {
    const { id } = useParams();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]); // [{productId, extraDiscount, customOfferText}]
    const router = useRouter();

    useEffect(() => {
        api.get('/api/products').then(res => {
            setProducts(res.data.products || res.data);
        });
        api.get(`/api/offers/${id}`).then(res => {
            const offer = res.data;
            setName(offer.name);
            setDescription(offer.description);
            setStartDate(offer.startDate?.slice(0, 10));
            setEndDate(offer.endDate?.slice(0, 10));
            setIsActive(!!offer.isActive);
            setSelectedProducts(
                (offer.products || []).map((p: any) => ({
                    productId: p.id,
                    extraDiscount: p.OfferProduct?.extraDiscount || 0,
                    customOfferText: p.OfferProduct?.customOfferText || '',
                }))
            );
        });
    }, [id]);

    const handleProductSelect = (productId: string) => {
        if (selectedProducts.find((p) => p.productId === productId)) {
            setSelectedProducts(selectedProducts.filter((p) => p.productId !== productId));
        } else {
            setSelectedProducts([...selectedProducts, { productId, extraDiscount: 0, customOfferText: '' }]);
        }
    };

    const handleProductFieldChange = (productId: string, field: string, value: any) => {
        setSelectedProducts(selectedProducts.map((p) =>
            p.productId === productId ? { ...p, [field]: value } : p
        ));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        await api.put(`/api/offers/${id}`, {
            name,
            description,
            startDate,
            endDate,
            isActive,
            products: selectedProducts,
        });
        router.push('/dashboard/offers');
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Edit Offer</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label>Name</label>
                    <input className="border w-full" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <label>Description</label>
                    <textarea className="border w-full" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div>
                    <label>Start Date</label>
                    <input type="date" className="border w-full" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div>
                    <label>End Date</label>
                    <input type="date" className="border w-full" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </div>
                <div>
                    <label>Status</label>
                    <select className="border w-full" value={isActive ? 'active' : 'inactive'} onChange={e => setIsActive(e.target.value === 'active')}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div>
                    <label>Products</label>
                    <div className="border p-2 max-h-48 overflow-y-auto">
                        {products.map(product => (
                            <div key={product.id} className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    checked={!!selectedProducts.find((p) => p.productId === product.id)}
                                    onChange={() => handleProductSelect(product.id)}
                                />
                                <span className="ml-2">{product.name}</span>
                                {selectedProducts.find((p) => p.productId === product.id) && (
                                    <div className="flex ml-4 gap-2">
                                        <input
                                            type="number"
                                            placeholder="Extra Discount %"
                                            className="border w-24"
                                            value={selectedProducts.find((p) => p.productId === product.id)?.extraDiscount || 0}
                                            onChange={e => handleProductFieldChange(product.id, 'extraDiscount', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Custom Offer Text"
                                            className="border w-40"
                                            value={selectedProducts.find((p) => p.productId === product.id)?.customOfferText || ''}
                                            onChange={e => handleProductFieldChange(product.id, 'customOfferText', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Update Offer</button>
            </form>
        </div>
    );
} 