'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    ShoppingBagIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Products', href: '/dashboard/products', icon: ShoppingBagIcon },
    { name: 'Orders', href: '/dashboard/orders', icon: ClipboardDocumentListIcon },
    { name: 'Delivery Boys', href: '/dashboard/delivery-boys', icon: TruckIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50 lg:hidden"
                    onClose={setSidebarOpen}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-2xl rounded-r-3xl border-r border-gray-100">
                                    <div className="flex h-16 shrink-0 items-center">
                                        <img
                                            className="h-8 w-auto"
                                            src="/images/dms-logo.png"
                                            alt="DMSM Admin"
                                        />
                                    </div>
                                    <nav className="flex flex-1 flex-col">
                                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                            <li>
                                                <ul role="list" className="-mx-2 space-y-1">
                                                    {navigation.map((item) => (
                                                        <li key={item.name}>
                                                            <Link
                                                                href={item.href}
                                                                className={`
                                  group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-200 hover:scale-105
                                  ${pathname === item.href
                                                                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25'
                                                                        : 'text-gray-700 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50'
                                                                    }
                                `}
                                                            >
                                                                <item.icon
                                                                    className={`h-6 w-6 shrink-0 transition-colors duration-200 ${pathname === item.href
                                                                        ? 'text-white'
                                                                        : 'text-gray-400 group-hover:text-green-600'
                                                                        }`}
                                                                    aria-hidden="true"
                                                                />
                                                                {item.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-xl border-r border-gray-100">
                    <div className="flex h-16 shrink-0 items-center">
                        <img
                            className="h-8 w-auto"
                            src="/images/dms-logo.png"
                            alt="DMSM Admin"
                        />
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={`
                          group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-200 hover:scale-105
                          ${pathname === item.href
                                                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25'
                                                        : 'text-gray-700 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50'
                                                    }
                        `}
                                            >
                                                <item.icon
                                                    className={`h-6 w-6 shrink-0 transition-colors duration-200 ${pathname === item.href
                                                        ? 'text-white'
                                                        : 'text-gray-400 group-hover:text-green-600'
                                                        }`}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div className="lg:pl-72">
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-white/80 backdrop-blur-md px-4 shadow-sm border-b border-gray-100 sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>

                    {/* Separator */}
                    <div
                        className="h-6 w-px bg-gray-200 lg:hidden"
                        aria-hidden="true"
                    />

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1" />
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            {/* Profile dropdown */}
                            <button
                                type="button"
                                className="-m-1.5 flex items-center p-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-red-500/25"
                                onClick={() => {
                                    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
                                    window.location.href = '/login';
                                }}
                            >
                                <span className="sr-only">Sign out</span>
                                <span className="text-sm font-semibold leading-6">
                                    Sign out
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <main className="py-10">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
} 