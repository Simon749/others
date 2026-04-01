"use client"
import React from 'react'
import { GraduationCapIcon, Hand, LayoutDashboardIcon, SettingsIcon } from 'lucide-react'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import Image from 'next/image';

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
        <div className='border shadow-md h-screen p-5'>
            <img src={'/logo.svg'}
                alt='logo'
                width={50}
                height={50} />

            <hr className='my-5'></hr>

            {menuList.map((menu, index) => (
             <h2 key={menu.id}
            className='flex items-center gap-3 text-md p-4
            text-slate-500
            hover:bg-pimary
            cursor-pointer
            hover:text-blue-500
            rounded-lg
            my-2
            '>
                    <menu.icon />
                    {menu.name}
                </h2>
            ))}

            <div>
                <hr className='my-5'></hr>
                <img src={user?.picture}
                    height={35}
                    alt='user'
                    className='rounded-full'
                />
                <div>
                    <h2>{user?.given_name} {user?.family_name}</h2>
                    <h2>{user?.email}</h2>
                </div>
            </div>
        </div>


    )
}


export default SideNav