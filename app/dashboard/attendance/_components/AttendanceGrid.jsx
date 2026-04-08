"use client"
import React, { useEffect, useState } from "react";
import { AgGridReact } from 'ag-grid-react';
import moment from "moment";
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { toast } from "sonner";
import GlobalApi from "@/app/_services/GlobalApi";
import { getUniqueRecords } from "@/app/_services/service";


const pagination = true;
const paginationPageSize = 10;
const paginationPageSelector = [25, 50, 100];


ModuleRegistry.registerModules([AllCommunityModule]);

function AttendanceGrid({ attendance, selectedMonth }) {

    const [rowData, setRowData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([
        { field: 'studentId', filter: 'true'},
        { field: 'name',filter: 'true' },
    ]);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const numberOfDays = daysInMonth(moment(selectedMonth).format("YYYY"), moment(selectedMonth).format("MM"));

    const dayArrays = Array.from({ length: numberOfDays }, (_, i) => i + 1);

    useEffect(() => {
        if (attendance) {
            const userList = getUniqueRecords(attendance);
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
            })
        }
        else {
            // Mark attendance as absent
            GlobalApi.MarkAbsent(studentId, day, date).then(resp => {
                console.log(resp);
                toast("Student Id: " + studentId + " marked absent for day: " + day);
            })
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
                    quickFilterText={""}
                    pagination={pagination}
                    paginationPageSize={paginationPageSize}
                    paginationPageSelector={paginationPageSelector}
                />
            </div>


        </div>
    )
}

export default AttendanceGrid;
