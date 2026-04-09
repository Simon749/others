"use client"
import React, { useEffect, useState }  from 'react'
import { useTheme } from "next-themes"
import MonthlySelection from '../_components/MonthSelection'
import GradeSelection from '../_components/GradeSelection'
import moment from 'moment'
import GlodalApi from '../_services/GlobalApi'
import StatusList from './_components/StatusList'
import BarChartComponet from './_components/BarChartComponent'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, BarChart3, Users, Download, FileText } from "lucide-react"

const dashboard = () => {
  const {setTheme} = useTheme()
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedGrade, setSelectedGrade] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [totalPresentData, setTotalPresentData] = useState([]);

  useEffect(() => {
    setTheme("light")
    if (selectedGrade) {
      GetStudentAttendance();
      GetTotalPresentCountByDay();
    }
  }, [selectedMonth, selectedGrade])

  const GetStudentAttendance = () => {
    if (!selectedGrade) {
      setAttendance([]);
      return;
    }

    GlodalApi.GetAttendance(selectedGrade, moment(selectedMonth).format("YYYY-MM"))
    .then(resp => {
      // Handle response - ensure it's an array
      setAttendance(Array.isArray(resp.data) ? resp.data : [])
    })
    .catch(err => {
      console.error("Error fetching attendance:", err);
      setAttendance([]);
    })
  }

  const GetTotalPresentCountByDay = () => {
    if (!selectedGrade) {
      setTotalPresentData([]);
      return;
    }

    GlodalApi.TotalPresentCountByDay(selectedGrade, moment(selectedMonth).format("YYYY-MM"))
    .then(resp => {
      // Handle response - ensure it's an array
      setTotalPresentData(Array.isArray(resp.data) ? resp.data : [])
    })
    .catch(err => {
      console.error("Error fetching present count data:", err);
      setTotalPresentData([]);
    })
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto p-6 space-y-8'>
        {/* Header Section */}
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
            <p className='text-gray-600 mt-2'>Welcome back! Here's your attendance overview.</p>
          </div>

          {/* Filters */}
          <Card className="lg:min-w-[400px]">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Month</label>
                  <MonthlySelection
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Grade</label>
                  <GradeSelection
                    selectedGrade={selectedGrade}
                    onGradeChange={setSelectedGrade}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <StatusList attendance={attendance}/>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Attendance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartComponet
                  attendance={attendance}
                  totalPresentData={totalPresentData}
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard/attendance'}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Mark Attendance
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard/students'}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Students
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {/* Export functionality */}}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Attendance marked for Grade 1A</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New student added</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Monthly report generated</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default dashboard
