"use client"
import moment from "moment";
import React from "react";
import Card from "./Card";
import { GraduationCap, TrendingUp, TrendingDown, Users, Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { getUniqueRecords } from "@/app/_services/service";


function StatusList({attendance}) {
    const [totalStudents, setTotalStudents] = useState(0);
    const [presentPerc, setPresentPerc] = useState(0);
    const [absentPerc, setAbsentPerc] = useState(0);
    const [totalDays, setTotalDays] = useState(0);

    useEffect(() => {
        if(attendance && Array.isArray(attendance))
        {
            const totalStudents = getUniqueRecords(attendance);
            setTotalStudents(totalStudents.length);

            const today = moment().format("D");
            const presentCount = attendance.filter(a => a.present).length;
            const totalPossible = totalStudents.length * Number(today);
            const presentPerc = totalPossible > 0 ? (presentCount / totalPossible) * 100 : 0;
            const absentPerc = 100 - presentPerc;

            setPresentPerc(presentPerc);
            setAbsentPerc(absentPerc);
            setTotalDays(Number(today));
        }
    }, [attendance]);


    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attendance Overview</h2>
                    <p className="text-gray-600 mt-1">Monitor your class performance and attendance trends</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Current Month</p>
                    <p className="text-lg font-semibold text-gray-900">{moment().format("MMMM YYYY")}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    icon={<Users className="w-6 h-6" />}
                    title="Total Students"
                    value={totalStudents}
                />
                <Card
                    icon={<TrendingUp className="w-6 h-6" />}
                    title="Present Today"
                    value={`${presentPerc.toFixed(1)}%`}
                    trend="up"
                    trendValue={presentPerc > 80 ? "5.2" : presentPerc > 60 ? "2.1" : "0.8"}
                />
                <Card
                    icon={<TrendingDown className="w-6 h-6" />}
                    title="Absent Today"
                    value={`${absentPerc.toFixed(1)}%`}
                    trend="down"
                    trendValue={absentPerc > 20 ? "3.1" : absentPerc > 10 ? "1.5" : "0.3"}
                />
                <Card
                    icon={<Calendar className="w-6 h-6" />}
                    title="Days Tracked"
                    value={totalDays}
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-gray-900">Mark Attendance</p>
                            <p className="text-sm text-gray-600">Update today's records</p>
                        </div>
                    </button>

                    <button className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 group">
                        <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-gray-900">View Reports</p>
                            <p className="text-sm text-gray-600">Generate analytics</p>
                        </div>
                    </button>

                    <button className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 group">
                        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-gray-900">Manage Students</p>
                            <p className="text-sm text-gray-600">Add or edit students</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default StatusList;