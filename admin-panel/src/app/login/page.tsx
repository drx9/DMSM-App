'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaEnvelope } from 'react-icons/fa';
import { signIn } from 'next-auth/react';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        try {
            setIsLoading(true);
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app'}/api/auth/admin-login`,
                data
            );

            if (response.data.token) {
                // Store token in localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('admin_token', response.data.token);
                }
                toast.success('Login successful!');
                router.push('/dashboard');
            } else {
                toast.error('No token received');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Admin Login
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <input
                                {...register('email')}
                                id="email"
                                type="email"
                                autoComplete="email"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                {...register('password')}
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
                <div className="flex flex-col items-center mt-6 space-y-2">
                    <span className="text-gray-500">or sign in with</span>
                    <div className="flex gap-4 mt-2">
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                        >
                            <FcGoogle size={24} /> Google
                        </button>
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                            disabled
                        >
                            <FaFacebook size={24} color="#1877F3" /> Facebook
                        </button>
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                            onClick={() => document.getElementById('email')?.focus()}
                        >
                            <FaEnvelope size={24} color="#EA4335" /> Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 