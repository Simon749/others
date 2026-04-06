"use client"

import GradeSelection from "@/app/_components/GradeSelection";
import MonthlySelection from "@/app/_components/MonthSelection";
import GlobalApi from "@/app/_services/GlobalApi";
import { Button } from "@/components/ui/button";
import moment from "moment";
import React, { useState } from "react";
import AttendanceGrid from "./_components/AttendanceGrid";

function Attendance() {
    const [selectedMonth, setSelectedMonth] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState([]); 
    const [attendance, setAttendance] = useState([]);  

    /**
     * used to fetch attendance data based on selected grade and month
    */
    const onSearchHandler = () => {
        // Implement search logic here
        const month = moment(selectedMonth).format("YYYY-MM");
        GlobalApi.GetAttendance(selectedGrade, month).then(resp => {
            setAttendance(resp.data);
        });

    }
    return (
        <div className="p-7">
            <h2 className="font-bold text-4xl">Attendance</h2>
            {/* Search and Filter Section */}

            <div className="flex gap-5 my-5 border rounded-lg p-5 shadow-sm">
                <div className="flex gap-2 items-center">
                    <label>Select Month</label>
                    <MonthlySelection selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
                </div>

                <div className="flex gap-2 items-center">
                    <label>Select Grade</label>
                    <GradeSelection selectedGrade={(v)=>setSelectedGrade(v)} />
                </div>
                <Button
                onClick={()=>onSearchHandler()}
                >
                    Search</Button>
            </div>

            {/* Attendance Table */}

            <AttendanceGrid attendance={attendance}
            selectedMonth={selectedMonth} />


        </div>
    )
}

export default Attendance;