"use client"
import React from 'react'
import { useTheme } from "next-themes"
import { useEffect } from 'react'

const dashboard = () => {
  const {setTheme} = useTheme()

  useEffect(() => {
    setTheme("light")
  }, [])
  return (
    <div>
      dashboard
    </div>
  )
}

export default dashboard
