"use client"
import React from 'react'
import { GraduationCapIcon, Hand, LayoutDashboardIcon, SettingsIcon, LogOut } from 'lucide-react'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

function SideNav() {

    const { user } = useKindeBrowserClient();

    const menuList = [
        {
            id: 1,
            name: "Dashboard",
            icon: LayoutDashboardIcon,
            path: "/dashboard"
        },
        {
            id: 2,
            name: "Students",
            icon: GraduationCapIcon,
            path: "/dashboard/students"
        },
        {
            id: 3,
            name: "Attendance",
            icon: Hand,
            path: "/dashboard/attendance"
        },
        {
            id: 4,
            name: "Settings",
            icon: SettingsIcon,
            path: "/dashboard/settings"
        },

    ];

    return (
        <div className='bg-white border-r border-gray-200 h-screen p-6 shadow-lg'>
            <div className='flex items-center gap-3 mb-8'>
                <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                    <GraduationCapIcon className='w-6 h-6 text-white' />
                </div>
                <div>
                    <h1 className='text-lg font-bold text-gray-900'>SchoolTracker</h1>
                    <p className='text-xs text-gray-500'>Attendance System</p>
                </div>
            </div>

            <hr className='my-6 border-gray-200'></hr>

            <div className='space-y-2'>
                {menuList.map((menu, index) => (
                    <Link
                        key={menu.id}
                        href={menu.path}
                        className='flex items-center gap-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group'
                    >
                        <menu.icon className='w-5 h-5 group-hover:text-blue-600' />
                        <span className='font-medium'>{menu.name}</span>
                    </Link>
                ))}
            </div>

            <div className='absolute bottom-6 left-6 right-6'>
                <hr className='my-4 border-gray-200'></hr>

                {/* User Info */}
                <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4'>
                    <img src={user?.picture} height={40} width={40} alt='user' className='rounded-full border-2 border-white shadow-sm' />
                    <div className='flex-1 min-w-0'>
                        <h2 className='text-sm font-semibold text-gray-900 truncate'>{user?.given_name} {user?.family_name}</h2>
                        <h2 className='text-xs text-gray-500 truncate'>{user?.email}</h2>
                    </div>
                </div>

                {/* Logout Button */}
                <LogoutLink className='flex items-center gap-3 text-red-600 p-3 rounded-lg hover:bg-red-50 transition-all duration-200 cursor-pointer w-full'>
                    <LogOut className='w-5 h-5' />
                    <span className='font-medium'>Log out</span>
                </LogoutLink>
            </div>
        </div>
    )
}


export default SideNav