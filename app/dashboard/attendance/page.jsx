"use client"

import GradeSelection from "@/app/_components/GradeSelection";
import StreamSelection from "@/app/_components/StreamSelection";
import MonthlySelection from "@/app/_components/MonthSelection";
import GlobalApi from "@/app/_services/GlobalApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import moment from "moment";
import React, { useState } from "react";
import AttendanceGrid from "./_components/AttendanceGrid";
import { Search, FileText, Download, Save, Calendar, Users, TrendingUp, BarChart3 } from "lucide-react";
import { toast } from "sonner";

function Attendance() {
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedGrade, setSelectedGrade] = useState(""); 
    const [selectedStream, setSelectedStream] = useState("");
    const [attendance, setAttendance] = useState([]);
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    /**
     * used to fetch attendance data based on selected grade, stream, and month
    */
    const onSearchHandler = async () => {
        if (!selectedGrade || !selectedMonth) {
            toast.error("Please select both Grade and Month");
            return;
        }

        setIsLoading(true);
        try {
            const month = moment(selectedMonth).format("YYYY-MM");
            const resp = await GlobalApi.GetAttendance(selectedGrade, month, selectedStream);
            setAttendance(Array.isArray(resp.data) ? resp.data : []);
            toast.success("Attendance data loaded successfully");
        } catch (err) {
            console.error("Error fetching attendance:", err);
            setAttendance([]);
            toast.error("Failed to fetch attendance data");
        } finally {
            setIsLoading(false);
        }
    }

    const onDownloadCsv = async () => {
        if (!selectedGrade || !selectedMonth) {
            toast.error("Please select both Grade and Month before exporting.");
            return;
        }

        try {
            const month = moment(selectedMonth).format("YYYY-MM");
            const response = await GlobalApi.ExportAttendanceCsv(selectedGrade, month);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `attendance-${selectedGrade}-${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("CSV exported successfully");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to export attendance CSV.");
        }
    };

    const onGenerateReport = async () => {
        if (!selectedGrade || !selectedMonth) {
            toast.error("Please select both Grade and Month before generating a report.");
            return;
        }

        setIsGeneratingReport(true);
        try {
            const month = moment(selectedMonth).format("YYYY-MM");
            const resp = await GlobalApi.GetAttendanceReport(selectedGrade, month);
            setReport(resp.data);
            toast.success("Report generated successfully");
        } catch (error) {
            console.error("Report error:", error);
            setReport(null);
            toast.error("Failed to generate attendance report.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
                        <p className="text-gray-600 mt-2">Track and manage student attendance efficiently</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="px-3 py-1">
                            {moment(selectedMonth).format("MMMM YYYY")}
                        </Badge>
                        {selectedGrade && (
                            <Badge variant="outline" className="px-3 py-1">
                                Grade {selectedGrade}
                            </Badge>
                        )}
                    </div>
                </div>
                {/* Filters Card */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-blue-600" />
                            Search & Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Month</label>
                                <MonthlySelection
                                    selectedMonth={selectedMonth}
                                    onMonthChange={setSelectedMonth}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Grade</label>
                                <GradeSelection
                                    selectedGrade={selectedGrade}
                                    onGradeChange={setSelectedGrade}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Stream</label>
                                <StreamSelection
                                    selectedGrade={selectedGrade}
                                    selectedStream={selectedStream}
                                    onStreamChange={setSelectedStream}
                                />
                            </div>

                            <div className="flex items-end">
                                <Button
                                    onClick={onSearchHandler}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4 mr-2" />
                                            Search
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="secondary"
                                onClick={onGenerateReport}
                                disabled={isGeneratingReport || !selectedGrade}
                            >
                                {isGeneratingReport ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Generate Report
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onDownloadCsv}
                                disabled={!selectedGrade}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Report Display */}
                {report && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Summary Cards */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-blue-600" />
                                        Attendance Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">{report.totalPresent}</div>
                                            <div className="text-sm text-green-700">Total Present</div>
                                        </div>
                                        <div className="text-center p-4 bg-red-50 rounded-lg">
                                            <div className="text-2xl font-bold text-red-600">{report.totalAbsent}</div>
                                            <div className="text-sm text-red-700">Total Absent</div>
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-lg font-semibold text-blue-600">
                                            {report.totalPresent + report.totalAbsent > 0
                                                ? ((report.totalPresent / (report.totalPresent + report.totalAbsent)) * 100).toFixed(1)
                                                : 0}%
                                        </div>
                                        <div className="text-sm text-blue-700">Overall Attendance Rate</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Reason Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {report.reasonCounts.map((item) => (
                                            <div key={item.reason} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="capitalize text-sm font-medium">{item.reason.replace('_', ' ')}</span>
                                                <Badge variant="secondary">{item.count}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Daily Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                    Daily Attendance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-96 overflow-y-auto space-y-2">
                                    {report.dailyTotals.map((item) => (
                                        <div key={item.day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-purple-700">{item.day}</span>
                                                </div>
                                                <span className="text-sm font-medium">Day {item.day}</span>
                                            </div>
                                            <div className="flex gap-4 text-sm">
                                                <span className="text-green-600">✓ {item.presentCount}</span>
                                                <span className="text-red-600">✗ {item.absentCount}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Attendance Grid */}
                {attendance.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                Attendance Grid
                                <Badge variant="outline" className="ml-auto">
                                    {attendance.length} records
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AttendanceGrid
                                attendance={attendance}
                                selectedMonth={selectedMonth}
                                selectedStream={selectedStream}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {!isLoading && attendance.length === 0 && selectedGrade && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance data found</h3>
                                <p className="text-gray-600 mb-4">
                                    No attendance records found for {selectedGrade} in {moment(selectedMonth).format("MMMM YYYY")}
                                </p>
                                <Button onClick={onSearchHandler}>
                                    <Search className="w-4 h-4 mr-2" />
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default Attendance;

