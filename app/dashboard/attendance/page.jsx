"use client"

import GradeSelection from "@/app/_components/GradeSelection";
import StreamSelection from "@/app/_components/StreamSelection";
import MonthlySelection from "@/app/_components/MonthSelection";
import GlobalApi from "@/app/_services/GlobalApi";
import { Button } from "@/components/ui/button";
import moment from "moment";
import React, { useState } from "react";
import AttendanceGrid from "./_components/AttendanceGrid";

function Attendance() {
    const [selectedMonth, setSelectedMonth] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState([]); 
    const [selectedStream, setSelectedStream] = useState([]);
    const [attendance, setAttendance] = useState([]);  

    /**
     * used to fetch attendance data based on selected grade, stream, and month
    */
    const onSearchHandler = () => {
        if (!selectedGrade || !selectedMonth) {
            alert("Please select both Grade and Month");
            return;
        }

        const month = moment(selectedMonth).format("YYYY-MM");
        GlobalApi.GetAttendance(selectedGrade, month, selectedStream).then(resp => {
            setAttendance(resp.data);
        }).catch(err => {
            console.error("Error fetching attendance:", err);
            alert("Failed to fetch attendance data");
        });
    }

    
    return (
        <div className="p-7">
            <h2 className="font-bold text-4xl">Attendance</h2>
            {/* Search and Filter Section */}

            <div className="flex gap-5 my-5 border rounded-lg p-5 shadow-sm flex-wrap">
                <div className="flex gap-2 items-center">
                    <label>Select Month</label>
                    <MonthlySelection selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
                </div>

                <div className="flex gap-2 items-center">
                    <label>Select Grade</label>
                    <GradeSelection selectedGrade={(v)=>setSelectedGrade(v)} />
                </div>

                <div className="flex gap-2 items-center">
                    <label>Select Stream</label>
                    <StreamSelection 
                        selectedGrade={selectedGrade} 
                        selectedStream={selectedStream}
                        onStreamChange={setSelectedStream}
                    />
                </div>

                <Button onClick={()=>onSearchHandler()}>
                    Search
                </Button>
            </div>

            {/* Attendance Table */}

            <AttendanceGrid 
                attendance={attendance}
                selectedMonth={selectedMonth}
                selectedStream={selectedStream}
            />


        </div>
    )
}

export default Attendance;

