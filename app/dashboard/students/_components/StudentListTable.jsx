
"use client"
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Trash2Icon } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import GlobalApi from "@/app/_services/GlobalApi";

function StudentListTable({ studentList = [], refreshData, onSelectionChange }) {
    const [searchInput, setSearchInput] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);

    const filteredStudents = useMemo(() => {
        const query = searchInput.trim().toLowerCase();
        if (!query) return studentList;

        return studentList.filter((student) => {
            console.log("Raw Student List:", studentList);
            console.log("Filtered Students:", filteredStudents);
            const name = (student.fullName || student.name || "").toString().toLowerCase();
            const admissionDate = (student.admissionNumber || "").toString().toLowerCase();
            const grade = (student.class || student.grade || "").toString().toLowerCase();
            return name.includes(query) || admissionDate.includes(query) || grade.includes(query);
        });
    }, [searchInput, studentList]);

    useEffect(() => {
        onSelectionChange?.(selectedIds);
    }, [selectedIds, onSelectionChange]);

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const deleteRecord = async (id) => {
        try {
            const response = await GlobalApi.DeleteStudentRecord(id);
            if (response?.data) {
                toast("Record deleted successfully");
                refreshData();
                setSelectedIds((prev) => prev.filter((item) => item !== id));
            }
        } catch (error) {
            console.error("Delete student failed", error);
            toast("Unable to delete record. Please try again.");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <Search className="h-5 w-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search students by name, grade or admission number"
                        className="min-w-0 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        Showing <span className="font-semibold text-slate-900">{filteredStudents.length}</span> students
                    </div>
                    <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        Selected <span className="font-semibold text-slate-900">{selectedIds.length}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredStudents.length === 0 ? (
                    <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                        No students match your search. Try another name or grade.
                    </div>
                ) : (
                    filteredStudents.map((student) => (
                        <div key={student.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(student.id)}
                                            onChange={() => toggleSelect(student.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                        />
                                        <span>{student.admissionNumber || `ID ${student.id}`}</span>
                                    </div>
                                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{student.fullName || student.name}</h3>
                                    <p className="mt-2 text-sm text-slate-600">Grade: {student.class || student.grade || 'N/A'}</p>
                                    <p className="text-sm text-slate-600">Age: {student.age || '—'}</p>
                                    <p className="text-sm text-slate-600">Stream: {student.stream || 'General'}</p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" className="h-10 w-10 p-0">
                                            <Trash2Icon className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. Deleting this student will remove their record from the system.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteRecord(student.id)}>
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default StudentListTable;