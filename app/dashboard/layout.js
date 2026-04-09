import React from 'react'
import SideNav from './_components/SideNav'
import Header from './_components/Header'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner";

const layout = ({ children }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster />
      <div >
        <div className='md:w-64 fixed hidden md:block'>
          <SideNav/>
        </div>
        <div className='md:ml-64'>
          <Header/>
          {children}
        </div>
      </div>
    </ThemeProvider>
  )
}

export default layout