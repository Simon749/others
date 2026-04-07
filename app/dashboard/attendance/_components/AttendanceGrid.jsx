"use client"
import React, { useEffect, useState } from "react";
import { AgGridReact } from 'ag-grid-react';
import moment from "moment";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { toast } from "sonner";

ModuleRegistry.registerModules([AllCommunityModule]);

function AttendanceGrid({ attendance, selectedMonth }) {

    const [rowData, setRowData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([
        { field: 'studentId' },
        { field: 'name' },
    ]);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const numberOfDays = daysInMonth(moment(selectedMonth).format("YYYY"), moment(selectedMonth).format("MM"));

    const dayArrays = Array.from({ length: numberOfDays }, (_, i) => i + 1);

    useEffect(() => {
        if (attendance) {
            const userList = getUniqueRecords();
            setRowData(userList);

            dayArrays.forEach((date) => {
                setColumnDefs(prevData => [...prevData, {
                    field: date.toString(), width: 50, editable: true
                }])

                userList.forEach(obj => {
                    obj[date] = isPresent(obj.studentId, date)
                })
            })
        }
    }, [attendance]);

    /**
     * used to check if a student was present on a particular day
     * @param {*} studentId
     * @param {*} day
     * @returns
     */


    const isPresent = (studentId, day) => {
        const result = attendance.find(item => item.day === day && item.studentId === studentId);
        return result ? true : false;
    }

    /**
     * used to filter out unique records based on studentId as there can be multiple records for a student in case of multiple attendance entries for different days
     * 
     * @returns 
     */

    const getUniqueRecords = () => {
        const uniqueRecord = [];
        const existingUser = new Set();

        attendance?.forEach(record => {
            if (!existingUser.has(record.studentId)) {
                existingUser.add(record.studentId);
                uniqueRecord.push(record);
            }
        });
        return uniqueRecord;
    }

    /**
     * used to mark attendance for a student 
     * @param {*} day
     * @param {*} studentId
     * @param {*} presentStatus
     */

    const onMarkAttendance = (day, studentId, presentStatus) => {

      const date = moment(selectedMonth).format("YYYY-MM")   

        if (presentStatus)
        {
            const data = {
                studentId: studentId,
                day: day,
                present: presentStatus,
                date: date
            }

            // Mark attendance as present
            GlobalApi.MarkAttendance(data).then(resp => {
                console.log(resp);
                toast("Student Id: " + studentId + " marked present for day: " + day);
            });
        }
    }



    return (
        <div style={{ height: 500 }} className="ag-theme-alpine">

            {/* Data Grid will fill the size of the parent container */}
            <div>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}  
                    onCellValueChanged={(e)=> onMarkAttendance(e.columnDefs.field,e.data.studentId,e.newValue)}
                />
            </div>


        </div>
    )
}

export default AttendanceGrid;
