import React, { useEffect, useState } from "react";
import { BarChart, Legend, XAxis, YAxis, CartesianGrid, Tooltip, Bar, ResponsiveContainer } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';
import { getUniqueRecords } from "@/app/_services/service";

function BarChartComponet({ attendance, totalPresentData }) {

    const [data, setData] = useState([]);

    useEffect(() =>{
        formatAttendanceListCount();
    },[attendance || totalPresentData])
    const formatAttendanceListCount = () => {
        const totalStudent = getUniqueRecords(attendance);

        const result = totalPresentData.map((item=>({
            day:item.day,
            presentCount:item.presentCount,
            AbsentCount:Number(totalStudent?.length) -Number(item.presentCount)
        })))

        console.log(result);
        setData(result)
    }

    return (
        <div>
            <ResponsiveContainer width={'100%'} height={300}>
            <BarChart responsive data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis width="auto" />
                <Tooltip />
                <Legend />
                <Bar dataKey="presentCount" fill="#8884d8" name='Total Present' isAnimationActive={true} />
                <Bar dataKey="AbsentCount" fill="#82ca9d"  name='Total Absent' isAnimationActive={true} />
            </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default BarChartComponet