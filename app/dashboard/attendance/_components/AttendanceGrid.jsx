import React, { useEffect } from "react";
import { AgGridReact } from 'ag-grid-react';
import moment from "moment";

function AttendanceGrid({ attendance, selectedMonth }) {

    const [rowData, setRowData] = useState([]);
    const modules = [AllCommunityModule];
    const [columnDefs, setColumnDefs] = useState([
        { field: 'studentId' },
        { field: 'name' },
    ]);

    useEffect(() => {
        const userList = getUniqueRecords();
        setRowData(userList);
    }, [attendance]);

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

    const daysInMonth = (year, month) => new Date(year, month+1, 0).getDate();
    const numberOfDays = daysInMonth(moment(selectedMonth).format("YYYY"), moment(selectedMonth).format("MM"));
    return (
        <div>
            <AgGridProvider modules={modules}>
                {/* Data Grid will fill the size of the parent container */}
                <div style={{ height: 500 }}>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                    />
                </div>
            </AgGridProvider>
        </div>
    )
}

export default AttendanceGrid;
