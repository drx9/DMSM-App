'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
    PencilIcon,
    TrashIcon,
    PlusCircleIcon,
} from '@heroicons/react/24/outline';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    discount: number;
    stock: number;
    images: string[];
    isOutOfStock: boolean;
    isActive: boolean;
    categoryId: string;
}

interface Category {
    id: string;
    name: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // New state for sort/filter
    const [sort, setSort] = useState('createdAt');
    const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
    const [category, setCategory] = useState<string>('all');
    const [categories, setCategories] = useState<Category[]>([]);
    const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low_stock', 'out_of_stock'

    // Fetch categories for filter dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/api/categories');
                setCategories(response.data.categories || response.data);
            } catch (error) {
                toast.error('Failed to load categories');
            }
        };
        fetchCategories();
    }, []);

    // Fetch products with sort/order/category
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params: any = { sort, order };
            if (category !== 'all') params.category = category;
            const response = await api.get('/api/products', { params });
            setProducts(response.data.products);
        } catch (error) {
            toast.error('Failed to load products.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line
    }, [sort, order, category]);

    // Local stock filter (client-side)
    useEffect(() => {
        let currentProducts = products;
        if (stockFilter === 'low_stock') {
            currentProducts = products.filter(product => product.stock > 0 && product.stock <= 10);
        } else if (stockFilter === 'out_of_stock') {
            currentProducts = products.filter(product => product.isOutOfStock || product.stock === 0);
        }
        setFilteredProducts(currentProducts);
    }, [products, stockFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            setDeletingId(id);
            await api.delete(`/api/products/${id}`);
            toast.success('Product deleted successfully!');
            fetchProducts(); // Refresh the list
        } catch (error) {
            toast.error('Failed to delete product.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                    <div className="sm:flex sm:items-center sm:justify-between">
                        <div className="sm:flex-auto">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                                Products
                            </h1>
                            <p className="mt-3 text-gray-600 text-lg">
                                Manage your store inventory with advanced filtering and sorting options
                            </p>
                        </div>
                        <div className="mt-6 sm:ml-16 sm:mt-0 sm:flex-none">
                            <Link
                                href="/dashboard/products/new"
                                className="inline-flex items-center rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-green-600 hover:to-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-all duration-200 transform hover:scale-105"
                            >
                                <PlusCircleIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                                Add Product
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters & Sorting</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Sort by</label>
                            <select
                                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-colors duration-200"
                                value={sort}
                                onChange={e => setSort(e.target.value)}
                            >
                                <option value="createdAt">Newest</option>
                                <option value="price">Price</option>
                                <option value="stock">Stock</option>
                                <option value="discount">Discount</option>
                                <option value="name">Name</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Order</label>
                            <select
                                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-colors duration-200"
                                value={order}
                                onChange={e => setOrder(e.target.value as 'ASC' | 'DESC')}
                            >
                                <option value="DESC">Descending</option>
                                <option value="ASC">Ascending</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-colors duration-200"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Stock Filter</label>
                            <select
                                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-colors duration-200"
                                value={stockFilter}
                                onChange={e => setStockFilter(e.target.value)}
                            >
                                <option value="all">All Products</option>
                                <option value="low_stock">Low Stock (≤ 10)</option>
                                <option value="out_of_stock">Out of Stock (0)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            <p className="mt-4 text-gray-500 text-lg">Loading products...</p>
                        </div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
                        <div className="text-center text-gray-500">
                            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-6v.01M12 17v.01" />
                                </svg>
                            </div>
                            <p className="text-lg">No products found matching the filter</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="py-4 pl-6 pr-3 text-left text-sm font-semibold text-gray-800"
                                        >
                                            Product Name
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-4 text-left text-sm font-semibold text-gray-800"
                                        >
                                            Price
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-4 text-left text-sm font-semibold text-gray-800"
                                        >
                                            Stock
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-4 text-left text-sm font-semibold text-gray-800"
                                        >
                                            Status
                                        </th>
                                        <th scope="col" className="relative py-4 pl-3 pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm font-medium text-gray-900">
                                                {product.name}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5 text-sm">
                                                <span className="font-semibold text-gray-800">₹{product.price.toLocaleString()}</span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5 text-sm">
                                                <span className={`font-medium ${product.stock === 0 ? 'text-red-600' :
                                                    product.stock <= 10 ? 'text-orange-600' : 'text-green-600'
                                                    }`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5 text-sm">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${product.isOutOfStock || product.stock === 0
                                                        ? 'bg-red-50 text-red-700 ring-red-200'
                                                        : product.stock <= 10
                                                            ? 'bg-orange-50 text-orange-700 ring-orange-200'
                                                            : product.isActive
                                                                ? 'bg-green-50 text-green-700 ring-green-200'
                                                                : 'bg-gray-50 text-gray-700 ring-gray-200'
                                                        }`}
                                                >
                                                    {product.isOutOfStock || product.stock === 0
                                                        ? 'Out of Stock'
                                                        : product.stock <= 10
                                                            ? 'Low Stock'
                                                            : product.isActive
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="relative whitespace-nowrap py-5 pl-3 pr-6 text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <Link
                                                        href={`/dashboard/products/${product.id}`}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200"
                                                    >
                                                        <PencilIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        disabled={deletingId === product.id}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                                    >
                                                        {deletingId === product.id ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                                                        ) : (
                                                            <TrashIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                                                        )}
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 