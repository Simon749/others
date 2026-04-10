"use client"
import React, { useEffect, useMemo, useState } from "react";
import AddNewStudent from "./_components/AddNewStudent";
import GlobalApi from "@/app/_services/GlobalApi";
import StudentListTable from "./_components/StudentListTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bell, Mail, MessageCircle, Send } from "lucide-react";

function Student() {
    const [studentList, setStudentList] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [notificationType, setNotificationType] = useState("sms");
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationSubject, setNotificationSubject] = useState("");
    const [sendingNotification, setSendingNotification] = useState(false);

    useEffect(() => {
        GetAllStudents();
    }, []);

    const GetAllStudents = async () => {
        try {
            const resp = await GlobalApi.GetAllStudents();
            // If your API wraps data in 'results', use that. 
            // If it's a direct array, use resp.data.
            const data = resp.data.results || resp.data;
            setStudentList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    const selectedCount = selectedStudentIds.length;
    const selectedStudents = useMemo(
        () => studentList.filter((student) => selectedStudentIds.includes(student.id)),
        [studentList, selectedStudentIds]
    );

    const sendNotification = async () => {
        if (!notificationMessage.trim()) {
            toast.error("Please write a message before sending notifications.");
            return;
        }

        if (!selectedCount) {
            toast.error("Select at least one student to notify.");
            return;
        }

        setSendingNotification(true);

        try {
            await GlobalApi.SendNotification({
                type: notificationType,
                subject: notificationSubject,
                message: notificationMessage,
                recipients: selectedStudents.map((student) => ({
                    studentId: student.id,
                    fullName: student.fullName || student.name,
                    contact: notificationType === "sms" ? student.phone1 || student.phone2 : student.email,
                })),
            });
            toast.success("Notification queued successfully.");
            setNotificationMessage("");
            setNotificationSubject("");
            setSelectedStudentIds([]);
        } catch (error) {
            console.error("Notification send failed", error);
            toast.error("Unable to send notification. Try again.");
        } finally {
            setSendingNotification(false);
        }
    };

    return (
        <div className="space-y-8 p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Students</p>
                            <h1 className="text-3xl font-bold text-slate-900">Manage learners</h1>
                        </div>
                        <AddNewStudent refreshData={GetAllStudents} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Students</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-slate-900">{studentList.length}</p>
                                <p className="text-sm text-slate-500">Active learners enrolled in the system</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Selected</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-slate-900">{selectedCount}</p>
                                <p className="text-sm text-slate-500">Students selected for notifications</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-center gap-3 text-slate-700">
                            <Bell className="h-5 w-5 text-blue-600" />
                            <p className="text-sm">Notify parents and guardians in one click.</p>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full gap-2" variant="secondary">
                                        <MessageCircle className="h-4 w-4" />
                                        Quick message
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Send Parent Notification</DialogTitle>
                                        <DialogDescription>
                                            Select a notification type and send updates to selected student guardians.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <button
                                                type="button"
                                                className={`rounded-2xl border px-4 py-3 text-left text-sm ${notificationType === "sms" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`}
                                                onClick={() => setNotificationType("sms")}
                                            >
                                                <span className="font-semibold">SMS Alert</span>
                                                <p className="mt-1 text-xs text-slate-500">Quick mobile updates.</p>
                                            </button>
                                            <button
                                                type="button"
                                                className={`rounded-2xl border px-4 py-3 text-left text-sm ${notificationType === "email" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`}
                                                onClick={() => setNotificationType("email")}
                                            >
                                                <span className="font-semibold">Email Alert</span>
                                                <p className="mt-1 text-xs text-slate-500">More detailed communication.</p>
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Subject</label>
                                            <input
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                                value={notificationSubject}
                                                onChange={(event) => setNotificationSubject(event.target.value)}
                                                placeholder="Parent update subject"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Message</label>
                                            <textarea
                                                rows={5}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                                value={notificationMessage}
                                                onChange={(event) => setNotificationMessage(event.target.value)}
                                                placeholder="Write a short message for selected parents or guardians"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="text-sm text-slate-500">
                                                Sending to <span className="font-semibold text-slate-900">{selectedCount}</span> selected students
                                            </div>
                                            <div className="flex gap-2">
                                                <DialogClose asChild>
                                                    <Button variant="outline">Cancel</Button>
                                                </DialogClose>
                                                <Button onClick={sendNotification} disabled={sendingNotification || selectedCount === 0}>
                                                    {sendingNotification ? (
                                                        <span className="inline-flex items-center gap-2">
                                                            <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 010 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"></path>
                                                            </svg>
                                                            Sending...
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-2">
                                                            <Send className="h-4 w-4" /> Send notification
                                                        </span>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Action center</p>
                    <div className="rounded-3xl bg-slate-50 p-5 text-slate-700">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-indigo-600" />
                            <div>
                                <p className="font-semibold text-slate-900">Student notifications</p>
                                <p className="text-sm text-slate-500">Use the notification tray to keep families informed.</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5">
                            <p className="text-sm font-semibold text-slate-900">Recommended workflow</p>
                            <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                <li>• Search and select students.</li>
                                <li>• Choose SMS or email.</li>
                                <li>• Write a short, clear message.</li>
                                <li>• Send and follow up with guardians.</li>
                            </ul>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-5">
                            <p className="text-sm font-semibold text-slate-900">Quick note</p>
                            <p className="mt-2 text-sm text-slate-600">Notifications are currently queued in the app for demo mode; you can wire them to SMS/email provider APIs later.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <StudentListTable
                    studentList={studentList}
                    refreshData={GetAllStudents}
                    onSelectionChange={setSelectedStudentIds}
                />
            </div>
        </div>
    );
}

export default Student;