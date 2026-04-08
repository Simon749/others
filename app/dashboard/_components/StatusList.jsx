"use client"
import moment from "moment";
import React from "react";
import Card from "./Card";
import { GraduationCap } from "lucide-react";
import { TrendingUp } from "lucide-react";
import { TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getUniqueRecords } from "@/app/_services/service";


function StatusList({attendance}) {
    const [totalStudents, setTotalStudents] = useState(0);
    const [presentPerc, setPresentPerc] = useState(0);

    useEffect(() => {
        if(attendance)
        {
            const totalStudents = getUniqueRecords(attendance);
            setTotalStudents(totalStudents.length);

            const today = moment().format("D");
            const presentPerc = (attendance.length / (totalStudents.length*Number(today))* 100);
            setPresentPerc(presentPerc)
            
        }
    }, [attendance]);


    return (
        <div className="grid grid-cols-1
        md:grid-cols-2 lg:grid-cols-3 gap-5 my-6">
            <Card icon={<GraduationCap />} title="Total Students" value={totalStudents} />
            <Card icon={<TrendingUp />} title="Total Present Percentage" value={presentPerc.toFixed(2) + "%"} />
            <Card icon={<TrendingDown />} title="Total Absent Percentage" value={(100 - presentPerc).toFixed(2) + "%"} />
        </div>
    )
}

export default StatusList;