import React, { useEffect, useState } from "react";
import { BarChart, Legend, XAxis, YAxis, CartesianGrid, Tooltip, Bar, ResponsiveContainer, Cell } from 'recharts';
import { getUniqueRecords } from "@/app/_services/service";

function BarChartComponet({ attendance, totalPresentData }) {

    const [data, setData] = useState([]);

    useEffect(() =>{
        formatAttendanceListCount();
    },[attendance || totalPresentData])

    const formatAttendanceListCount = () => {
        if (!Array.isArray(attendance) || !Array.isArray(totalPresentData)) {
            setData([]);
            return;
        }

        const totalStudent = getUniqueRecords(attendance);

        const result = totalPresentData.map((item=>({
            day: item.day,
            presentCount: item.presentCount || 0,
            AbsentCount: Math.max(0, Number(totalStudent?.length || 0) - Number(item.presentCount || 0)),
            totalStudents: totalStudent?.length || 0
        })))

        setData(result)
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900">{`Day ${label}`}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full">
            {data.length > 0 ? (
                <ResponsiveContainer width={'100%'} height={350}>
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="day"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Bar
                            dataKey="presentCount"
                            name='Present'
                            radius={[4, 4, 0, 0]}
                            fill="#3b82f6"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#3b82f6" />
                            ))}
                        </Bar>
                        <Bar
                            dataKey="AbsentCount"
                            name='Absent'
                            radius={[4, 4, 0, 0]}
                            fill="#ef4444"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#ef4444" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-[350px] text-gray-500">
                    <div className="text-center">
                        <BarChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No attendance data available</p>
                        <p className="text-sm">Select a grade and month to view attendance trends</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BarChartComponet