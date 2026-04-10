"use client"
import React, { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import moment from "moment";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { toast } from "sonner";
import GlobalApi from "@/app/_services/GlobalApi";
import { getUniqueRecords } from "@/app/_services/service";

const pagination = true;
const paginationPageSize = 10;
const paginationPageSelector = [25, 50, 100];

ModuleRegistry.registerModules([AllCommunityModule]);

function AttendanceGrid({ attendance = [], studentList = [], selectedMonth }) {
    const [rowData, setRowData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([
        {
            headerName: 'Student Name',
            field: 'fullName', // Must be 'fullName' to match your database log!
            pinned: 'left',
            filter: true,
            width: 200
        },
    ]);
    const [gridApi, setGridApi] = useState(null);
    const [history, setHistory] = useState([]);
    const [backups, setBackups] = useState([]);

    const parsedMonth = moment(selectedMonth || new Date());
    const year = parsedMonth.year();
    const monthIndex = parsedMonth.month();

    const dayArrays = useMemo(
        () => Array.from({ length: new Date(year, monthIndex + 1, 0).getDate() }, (_, i) => i + 1),
        [year, monthIndex]
    );

    useEffect(() => {
        // 1. Identify our source of students (prioritize the master list of 103)
        const baseList = studentList.length > 0 ? studentList : getUniqueRecords(attendance);

        if (baseList.length > 0) {
            const rows = baseList.map((student) => {
                // 2. Map the ID and Name to match your Neon DB column names
                const sId = student.id || student.studentId;
                const sName = student.fullName || student.name;

                const row = {
                    studentId: sId,
                    fullName: sName, // Ag-Grid looks for this 'field'
                };

                // 3. Fill in the attendance checkboxes for each day
                dayArrays.forEach((day) => {
                    const record = attendance.find(
                        (att) => att.studentId === sId && att.day === day
                    );
                    // Default to false (Absent) so teachers can mark them present
                    row[day] = record ? record.present : false;
                });

                return row;
            });

            setRowData(rows);
        }
    }, [attendance, studentList, dayArrays]);

    useEffect(() => {
        // If we have marks, use them. If not, use the studentList template.
        const baseList = studentList.length > 0 ? studentList : getUniqueRecords(attendance);

        const rows = baseList.map((student) => {
            // Ensure we have a consistent ID
            const sId = student.studentId || student.id;
            const row = {
                ...student,
                studentId: sId,
                name: student.name
            };

            // Fill in the days of the month
            dayArrays.forEach((day) => {
                const record = attendance.find(att => att.studentId === sId && att.day === day);
                // Default to 'false' so teachers can click to change to 'true'
                row[day] = record ? record.present : false;
            });
            return row;
        });

        setRowData(rows);
    }, [attendance, studentList, dayArrays]);

    const loadSavedBackups = () => {
        try {
            const stored = localStorage.getItem("attendance-backups");
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Unable to load backups", error);
            return [];
        }
    };

    const saveBackups = (items) => {
        try {
            localStorage.setItem("attendance-backups", JSON.stringify(items));
        } catch (error) {
            console.error("Unable to save backups", error);
        }
    };

    const recordHistory = (event) => {
        const action = {
            id: `${Date.now()}-${event.studentId}-${event.day}`,
            studentId: event.studentId,
            day: event.day,
            oldValue: event.oldValue,
            newValue: event.newValue,
            timestamp: new Date().toISOString(),
        };
        setHistory((prev) => [action, ...prev].slice(0, 20));
    };

    const undoLastChange = () => {
        if (!history.length) {
            toast.error("No recent edits to undo.");
            return;
        }

        const [latest, ...rest] = history;
        setHistory(rest);

        setRowData((current) =>
            current.map((row) => {
                if (row.studentId === latest.studentId) {
                    return { ...row, [latest.day]: latest.oldValue };
                }
                return row;
            })
        );

        toast.success("Last attendance edit has been undone.");
    };

    const backupAttendanceSnapshot = () => {
        if (!attendance.length) {
            toast.error("No attendance loaded to back up.");
            return;
        }

        const snapshot = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            month: parsedMonth.format("YYYY-MM"),
            recordCount: attendance.length,
            data: attendance,
        };

        const updated = [snapshot, ...backups].slice(0, 10);
        setBackups(updated);
        saveBackups(updated);
        toast.success("Attendance snapshot saved.");
    };

    const restoreLatestBackup = () => {
        if (!backups.length) {
            toast.error("No backup snapshots available.");
            return;
        }

        const latest = backups[0];
        if (!latest?.data) {
            toast.error("The backup snapshot is invalid.");
            return;
        }

        const rows = getUniqueRecords(latest.data).map((obj) => {
            const row = { ...obj };
            dayArrays.forEach((day) => {
                row[day] = latest.data.some((item) => item.day === day && item.studentId === obj.studentId);
            });
            return row;
        });

        setRowData(rows);
        toast.success(`Restored attendance snapshot from ${new Date(latest.createdAt).toLocaleString()}`);
    };

    const parseBooleanValue = (value) => {
        if (typeof value === "boolean") return value;
        const lower = `${value}`.toLowerCase().trim();
        return lower === "true" || lower === "1" || lower === "✓";
    };

    const onMarkAttendance = (day, studentId, presentStatus) => {
        const date = parsedMonth.format("YYYY-MM");
        const present = parseBooleanValue(presentStatus);

        const data = {
            studentId,
            day,
            present,
            date,
        };

        if (present) {
            GlobalApi.MarkAttendance(data)
                .then(() => {
                    toast(`Student ${studentId} marked present for day ${day}`);
                })
                .catch((error) => {
                    console.error(error);
                    toast.error("Unable to update attendance.");
                });
        } else {
            GlobalApi.MarkAbsent(studentId, day, date)
                .then(() => {
                    toast(`Student ${studentId} marked absent for day ${day}`);
                })
                .catch((error) => {
                    console.error(error);
                    toast.error("Unable to update attendance.");
                });
        }
    };

    const onCellValueChanged = (event) => {
        const day = Number(event.colDef.field);
        if (!day) return;

        const oldValue = parseBooleanValue(event.oldValue);
        const newValue = parseBooleanValue(event.newValue);

        if (oldValue === newValue) return;

        recordHistory({ studentId: event.data.studentId, day, oldValue, newValue });
        onMarkAttendance(day, event.data.studentId, newValue);
    };

    const onSaveBulk = async () => {
        const month = parsedMonth.format("YYYY-MM");
        const entries = [];

        gridApi.forEachNode((node) => {
            const row = node.data;
            dayArrays.forEach((day) => {
                entries.push({
                    studentId: row.studentId,
                    date: month,
                    day: day,
                    present: row[day],
                    gradeId: selectedGrade, // Passed from parent
                    streamId: selectedStream  // Passed from parent
                });
            });
        });

        try {
            await GlobalApi.BulkMarkAttendance(entries);
            toast.success("Attendance synced to server");
        } catch (error) {
            toast.error("Network error. Please try again.");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <div className="text-sm font-semibold text-slate-700">Attendance tools</div>
                    <p className="text-sm text-slate-500">Keep quick history and snapshots for your attendance data.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600"
                        onClick={undoLastChange}
                    >
                        Undo last edit
                    </button>
                    <button
                        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        onClick={backupAttendanceSnapshot}
                    >
                        Save backup
                    </button>
                    <button
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600"
                        onClick={restoreLatestBackup}
                    >
                        Restore latest backup
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Recent edits</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{history.length}</p>
                    <p className="mt-2 text-sm text-slate-500">Undo stack entries stored in the current session.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Backup snapshots</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{backups.length}</p>
                    <p className="mt-2 text-sm text-slate-500">Saved locally in your browser.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Records</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{rowData.length}</p>
                    <p className="mt-2 text-sm text-slate-500">Students loaded into the attendance grid.</p>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-base font-semibold text-slate-900">Attendance Grid</p>
                    <button
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        onClick={onSaveBulk}
                    >
                        Save Bulk Attendance
                    </button>
                </div>
                <div style={{ minWidth: 920, height: 520 }} className="ag-theme-alpine">
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        onGridReady={(params) => setGridApi(params.api)}
                        onCellValueChanged={onCellValueChanged}
                        pagination={pagination}
                        paginationPageSize={paginationPageSize}
                        paginationPageSelector={paginationPageSelector}
                        suppressRowClickSelection={true}
                    />
                </div>
            </div>

            {backups.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2">
                    {backups.slice(0, 2).map((backup) => (
                        <div key={backup.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Snapshot</p>
                                    <p className="text-sm text-slate-500">{new Date(backup.createdAt).toLocaleString()}</p>
                                </div>
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{backup.recordCount} records</span>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">Month: {backup.month}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AttendanceGrid;
