"use client"
import React from 'react'
import Link from 'next/link';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { Bell, Search, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';

const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Attendance', href: '/dashboard/attendance' },
    { label: 'Students', href: '/dashboard/students' },
    { label: 'Settings', href: '/dashboard/settings' },
];

const Header = () => {
    const { user } = useKindeBrowserClient();

    return (
        <div className='sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-sm md:px-6'>
            <div className='flex items-center justify-between gap-4'>
                <div className='flex items-center gap-3 flex-1 min-w-0'>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant='ghost' size='sm' className='md:hidden'>
                                <Menu className='w-5 h-5 text-gray-700' />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <div className='flex items-center justify-between gap-2'>
                                    <DialogTitle>Navigation</DialogTitle>
                                    <DialogClose asChild>
                                        <Button variant='ghost' size='sm'>
                                            <X className='w-4 h-4' />
                                        </Button>
                                    </DialogClose>
                                </div>
                            </DialogHeader>
                            <div className='space-y-3 py-4'>
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className='block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-700 hover:border-blue-300 hover:bg-white'
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className='relative w-full'>
                        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                        <Input
                            placeholder='Search students, grades, and reports...'
                            className='pl-10 bg-gray-50 border-gray-200 focus:bg-white'
                        />
                    </div>
                </div>

                <div className='flex items-center gap-3'>
                    <Button variant='ghost' size='sm' className='relative'>
                        <Bell className='w-5 h-5 text-gray-600' />
                        <span className='absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500' />
                    </Button>

                    <Button variant='ghost' size='sm'>
                        <Settings className='w-5 h-5 text-gray-600' />
                    </Button>

                    <div className='flex items-center gap-3 rounded-full border border-gray-200 px-3 py-1'>
                        <div className='hidden sm:block text-right'>
                            <p className='text-sm font-medium text-gray-900'>{user?.given_name} {user?.family_name}</p>
                            <p className='text-xs text-gray-500'>Teacher</p>
                        </div>
                        <img
                            src={user?.picture}
                            width={40}
                            height={40}
                            alt='user'
                            className='h-10 w-10 rounded-full border-2 border-gray-200 object-cover'
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Header;