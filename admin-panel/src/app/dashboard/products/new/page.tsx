'use client';

import ProductForm from '@/app/dashboard/products/form';

export default function NewProductPage() {
    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">Add New Product</h1>
            <div className="mt-8">
                <ProductForm />
            </div>
        </div>
    );
} 