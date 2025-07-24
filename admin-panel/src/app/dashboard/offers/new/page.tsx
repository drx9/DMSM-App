'use client'
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Product {
    id: string;
    name: string;
}

export default function AddOfferPage() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]); // [{productId, extraDiscount, customOfferText}]
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [bannerImage, setBannerImage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        api.get('/api/products?limit=1000').then(res => {
            setProducts(res.data.products || res.data);
        });
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(handler);
    }, [search]);

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

    const handleBannerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'dmsmart'); // Change to your Cloudinary unsigned preset
        const res = await fetch('https://api.cloudinary.com/v1_1/dmsmart/image/upload', {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();
        setBannerImage(data.secure_url);
        setUploading(false);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        await api.post('/api/offers', {
            name,
            description,
            startDate,
            endDate,
            isActive,
            products: selectedProducts,
            banner_image: bannerImage,
        });
        router.push('/dashboard/offers');
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Add Offer</h1>
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
                    <label>Banner Image</label>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleBannerImageChange} />
                    {uploading && <span>Uploading...</span>}
                    {bannerImage && <img src={bannerImage} alt="Banner Preview" className="mt-2 w-full max-h-32 object-contain" />}
                </div>
                <div>
                    <label>Products</label>
                    <input
                        className="border w-full mb-2 px-2 py-1 rounded"
                        placeholder="Search products..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className="border p-2 max-h-48 overflow-y-auto">
                        {(products.filter(product =>
                            !debouncedSearch || product.name.toLowerCase().includes(debouncedSearch.toLowerCase())
                        )).map(product => (
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
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Create Offer</button>
            </form>
        </div>
    );
} 