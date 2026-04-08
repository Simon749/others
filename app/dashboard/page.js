"use client"
import React, { useEffect, useState }  from 'react'
import { useTheme } from "next-themes"
import MonthlySelection from '../_components/MonthSelection'
import GradeSelection from '../_components/GradeSelection'
import moment from 'moment'
import GlodalApi from '../_services/GlobalApi'
import StatusList from './_components/StatusList'
import BarChartComponet from './_components/BarChartComponent'

const dashboard = () => {
  const {setTheme} = useTheme()
  const [selectedMonth, setSelectedMonth] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [totalPresentData, setTotalPresentData] = useState([]);

  useEffect(() => {
    setTheme("light")
    GetStudentAttendance();
    GetTotalPresentCountByDay();
  }, [selectedMonth])

    useEffect(() => {
    setTheme("light")
    GetStudentAttendance();
    GetTotalPresentCountByDay();
  }, [selectedGrade])

  const GetStudentAttendance = () => {
    GlodalApi.GetAttendance(selectedGrade, moment(selectedMonth).format("YYYY-MM"))
    .then(resp => {
      // Handle response
    setAttendance(resp.data)
    })
  }
  const GetTotalPresentCountByDay = () => {
    GlodalApi.TotalPresentCountByDay(selectedGrade, moment(selectedMonth).format("YYYY-MM"))
    .then(resp => {
      // Handle response
    setTotalPresentData(resp.data)
    })
  }
  return (
    <div className='p-10'>
      <div className='flex items-center justify-between'>
      <h2 className='font-bold text-4xl'>Dashboard</h2>
      <div className='flex gap-4 items-center'>
        <MonthlySelection selectedMonth={setSelectedMonth}/>
        <GradeSelection selectedGrade={setSelectedGrade} />
      </div>
      </div>

      <StatusList attendance={attendance}/>

      <div className='grid grid-cols-1 md:grid-cols-3'>
        <div className='md:cols-span-2'>
          <BarChartComponet attendance={attendance}
          totalPresentData={totalPresentData} />
        </div>
      </div>
    </div>
  )
}

export default dashboard
