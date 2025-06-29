'use client';

import ProductForm from '@/app/dashboard/products/form';

interface EditProductPageProps {
    params: {
        id: string;
    };
}

export default function EditProductPage({ params }: EditProductPageProps) {
    const { id } = params;

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
            <div className="mt-8">
                <ProductForm productId={id} />
            </div>
        </div>
    );
} 