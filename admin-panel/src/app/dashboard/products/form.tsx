'use client';

import { useEffect, useState } from 'react';
import { useForm, Resolver, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.coerce.number().min(0.01, 'Price must be > 0'),
    discount: z.coerce.number().min(0).max(100, 'Discount 0–100'),
    stock: z.coerce.number().int().min(0, 'Stock ≥ 0'),
    images: z.string().min(1, 'Need at least one image URL'),
    categoryId: z.string().min(1, 'Category is required'),
    isActive: z.coerce.boolean(),
    rating: z.coerce.number().min(0).max(5),
    reviewCount: z.coerce.number().int().min(0),
});

// Now every property is required
type FormData = z.infer<typeof productSchema>;

export default function ProductForm({ productId }: { productId?: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imageSlots, setImageSlots] = useState<Array<string | null>>(Array(5).fill(null));
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [categories, setCategories] =
        useState<{ id: string; name: string }[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        control,
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(productSchema) as Resolver<FormData, any>,
        defaultValues: {
            // Must include every key in FormData
            name: '',
            description: '',
            price: 0,
            discount: 0,
            stock: 0,
            images: '',
            categoryId: '',
            isActive: true,
            rating: 0,
            reviewCount: 0,
        },
    });

    const watchedValues = useWatch({ control });

    useEffect(() => {
        api.get('/api/categories').then((res) => {
            setCategories(res.data.categories || res.data);
        });

        if (productId) {
            setLoading(true);
            api.get(`/api/products/${productId}`)
                .then((res) => {
                    const product = res.data;
                    reset(product);
                    if (product.images && Array.isArray(product.images)) {
                        const newImageSlots = Array(5).fill(null);
                        for (let i = 0; i < Math.min(product.images.length, 5); i++) {
                            newImageSlots[i] = product.images[i];
                        }
                        setImageSlots(newImageSlots);
                        setValue('images', product.images.join(','));
                    }
                })
                .catch((err) => {
                    toast.error('Failed to fetch product details.');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [productId, reset, setValue]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Create a unique toast ID for each upload slot
        const toastId = `upload-toast-${index}`;

        setIsUploading(true);
        toast.loading(`Uploading image...`, { id: toastId });

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/api/upload-avatar/product', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.url) {
                const newImageSlots = [...imageSlots];
                newImageSlots[index] = res.data.url;
                setImageSlots(newImageSlots);
                setValue('images', newImageSlots.filter(Boolean).join(','), { shouldValidate: true });
                toast.success('Image uploaded!', { id: toastId });
            } else {
                throw new Error('Image upload failed');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(`Upload failed: ${error.response?.data?.error || error.message}`, { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        const newImageSlots = [...imageSlots];
        newImageSlots[indexToRemove] = null;
        setImageSlots(newImageSlots);
        setValue('images', newImageSlots.filter(Boolean).join(','), { shouldValidate: true });
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            // Transform comma-separated URLs → string[]
            const imagesArr = data.images
                .split(',')
                .map((u) => u.trim())
                .filter(Boolean);
            const payload = {
                ...data,
                images: imagesArr,
                isOutOfStock: data.stock === 0,
            };

            if (productId) {
                await api.put(`/api/products/${productId}`, payload);
                toast.success('Product updated!');
            } else {
                await api.post('/api/products', payload);
                toast.success('Product added!');
            }

            router.push('/dashboard/products');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                        {productId ? 'Edit Product' : 'Add New Product'}
                    </h1>
                    <p className="mt-3 text-gray-600 text-lg">
                        {productId ? 'Update product information' : 'Create a new product for your store'}
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Basic Information Section */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-100">
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Name */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Name
                                    </label>
                                    <input
                                        {...register('name')}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-colors duration-200 px-4 py-3"
                                        placeholder="Enter product name"
                                    />
                                    {errors.name && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        {...register('description')}
                                        rows={4}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-colors duration-200 px-4 py-3 resize-none"
                                        placeholder="Describe your product..."
                                    />
                                    {errors.description && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.description.message}
                                        </p>
                                    )}
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        {...register('categoryId')}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-colors duration-200 px-4 py-3"
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.categoryId && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.categoryId.message}
                                        </p>
                                    )}
                                </div>

                                {/* Images Uploader */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Images (up to 5)
                                    </label>
                                    <div className="mt-2">
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                            {imageSlots.map((url, index) => (
                                                <div key={index} className="relative aspect-square group">
                                                    <label
                                                        htmlFor={`file-upload-${index}`}
                                                        className="flex items-center justify-center h-full w-full rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-green-500 hover:text-green-500 cursor-pointer transition-colors bg-gray-50 overflow-hidden"
                                                    >
                                                        {url ? (
                                                            <img
                                                                src={url}
                                                                alt={`Product image ${index + 1}`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        )}
                                                        <input
                                                            id={`file-upload-${index}`}
                                                            name={`file-upload-${index}`}
                                                            type="file"
                                                            className="sr-only"
                                                            onChange={(e) => handleFileChange(e, index)}
                                                            accept="image/*"
                                                            disabled={isUploading}
                                                        />
                                                    </label>
                                                    {url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage(index)}
                                                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {isUploading && (
                                        <p className="mt-2 text-sm text-blue-600 flex items-center">
                                            <svg className="animate-spin h-4 w-4 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Uploading in progress...
                                        </p>
                                    )}
                                    {errors.images && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {/* This error is for the underlying hidden input */}
                                            {errors.images.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Inventory Section */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-100">
                                Pricing & Inventory
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Price (₹)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('price')}
                                            className="w-full pl-8 pr-4 py-3 rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-colors duration-200"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.price && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.price.message}
                                        </p>
                                    )}
                                </div>

                                {/* Discount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('discount')}
                                            className="w-full px-4 py-3 pr-8 rounded-xl border-gray-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-50 hover:bg-white transition-colors duration-200"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                                    </div>
                                    {errors.discount && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.discount.message}
                                        </p>
                                    )}
                                </div>

                                {/* Stock */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Stock Quantity
                                    </label>
                                    <input
                                        type="number"
                                        {...register('stock')}
                                        className="w-full px-4 py-3 rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-colors duration-200"
                                        placeholder="0"
                                    />
                                    {errors.stock && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.stock.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Review & Status Section */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-100">
                                Review & Status
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Rating */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rating (0-5)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('rating')}
                                        className="w-full px-4 py-3 rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-colors duration-200"
                                        placeholder="0.0"
                                        min="0"
                                        max="5"
                                    />
                                    {errors.rating && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.rating.message}
                                        </p>
                                    )}
                                </div>

                                {/* Review Count */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Review Count
                                    </label>
                                    <input
                                        type="number"
                                        {...register('reviewCount')}
                                        className="w-full px-4 py-3 rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-colors duration-200"
                                        placeholder="0"
                                    />
                                    {errors.reviewCount && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.reviewCount.message}
                                        </p>
                                    )}
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center h-full">
                                    <div className="flex items-center">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                {...register('isActive')}
                                                className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">
                                                Product is Active
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setIsPreviewOpen(true)}
                                className="mr-4 px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                            >
                                Preview
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard/products')}
                                className="mr-4 px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center px-8 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        {productId ? 'Update' : 'Add'} Product
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {isPreviewOpen && <ProductPreviewModal product={watchedValues as any} onClose={() => setIsPreviewOpen(false)} />}
        </div>
    );
}

const ProductPreviewModal = ({ product, onClose }: { product: FormData & { images: string }, onClose: () => void }) => {
    const imageUrls = typeof product.images === 'string' ? product.images.split(',').filter(Boolean) : [];
    const discountedPrice = product.discount ? product.price - (product.price * product.discount) / 100 : product.price;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                {/* Product Card Preview */}
                <div className="relative">
                    <img src={imageUrls[0] || 'https://via.placeholder.com/400'} className="w-full h-56 object-cover" alt={product.name} />
                    {product.discount > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            {product.discount}% OFF
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 truncate">{product.name || "Product Name"}</h3>
                    <p className="text-sm text-gray-600 h-10 overflow-hidden">{product.description || "Product description goes here..."}</p>

                    <div className="flex items-baseline my-4">
                        <span className="text-2xl font-extrabold text-gray-900">₹{discountedPrice.toFixed(2)}</span>
                        {product.discount > 0 && (
                            <span className="ml-2 text-base text-gray-500 line-through">₹{product.price.toFixed(2)}</span>
                        )}
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span className="ml-1">{product.rating.toFixed(1)}</span>
                        <span className="mx-2">·</span>
                        <span>{product.reviewCount} reviews</span>
                        <span className="mx-2">·</span>
                        <span className={`${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                    </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 text-right">
                    <button onClick={onClose} type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
    );
}