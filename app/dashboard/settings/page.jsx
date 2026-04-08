"use client"
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bell, Database, ShieldCheck } from "lucide-react";

const STORAGE_KEY = "attendance-notification-settings";
const BACKUP_KEY = "attendance-backups";

function SettingsPage() {
    const [enableSms, setEnableSms] = useState(true);
    const [enableEmail, setEnableEmail] = useState(true);
    const [autoBackup, setAutoBackup] = useState(false);
    const [backups, setBackups] = useState([]);

    useEffect(() => {
        loadSettings();
        loadBackups();
    }, []);

    const loadSettings = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const saved = JSON.parse(stored);
                setEnableSms(saved.enableSms ?? true);
                setEnableEmail(saved.enableEmail ?? true);
                setAutoBackup(saved.autoBackup ?? false);
            }
        } catch (error) {
            console.error("Unable to load settings", error);
        }
    };

    const loadBackups = () => {
        try {
            const stored = localStorage.getItem(BACKUP_KEY);
            setBackups(stored ? JSON.parse(stored) : []);
        } catch (error) {
            console.error("Unable to load backups", error);
            setBackups([]);
        }
    };

    const saveSettings = () => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ enableSms, enableEmail, autoBackup })
            );
            toast.success("Settings saved successfully.");
        } catch (error) {
            console.error("Unable to save settings", error);
            toast.error("Could not save settings.");
        }
    };

    const clearBackups = () => {
        localStorage.removeItem(BACKUP_KEY);
        setBackups([]);
        toast.success("Backup history cleared.");
    };

    return (
        <div className="space-y-8 p-6 sm:p-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Settings</p>
                        <h1 className="text-3xl font-bold text-slate-900">Notification & backup preferences</h1>
                    </div>
                    <Button onClick={saveSettings}>Save settings</Button>
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-blue-600" />
                                Notification settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">SMS alerts</p>
                                        <p className="text-sm text-slate-600">Notify parents by SMS for absence and announcements.</p>
                                    </div>
                                    <button
                                        className={`rounded-full px-4 py-2 text-sm font-semibold ${enableSms ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                                        onClick={() => setEnableSms(!enableSms)}
                                    >
                                        {enableSms ? "Enabled" : "Disabled"}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">Email alerts</p>
                                        <p className="text-sm text-slate-600">Send student attendance updates through email.</p>
                                    </div>
                                    <button
                                        className={`rounded-full px-4 py-2 text-sm font-semibold ${enableEmail ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                                        onClick={() => setEnableEmail(!enableEmail)}
                                    >
                                        {enableEmail ? "Enabled" : "Disabled"}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">Automatic backups</p>
                                        <p className="text-sm text-slate-600">Save attendance snapshots locally after each session.</p>
                                    </div>
                                    <button
                                        className={`rounded-full px-4 py-2 text-sm font-semibold ${autoBackup ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                                        onClick={() => setAutoBackup(!autoBackup)}
                                    >
                                        {autoBackup ? "On" : "Off"}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-slate-700" />
                                Backup history
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-slate-600">Saved snapshots</p>
                                    <Badge variant="secondary">{backups.length}</Badge>
                                </div>
                                <p className="mt-2 text-sm text-slate-500">Restore or clean up attendance snapshots saved in your browser.</p>
                            </div>

                            {backups.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                                    No backups available yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {backups.slice(0, 3).map((backup) => (
                                        <div key={backup.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                            <p className="font-semibold text-slate-900">{new Date(backup.createdAt).toLocaleString()}</p>
                                            <p className="text-sm text-slate-500">{backup.recordCount} records · {backup.month}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button variant="outline" onClick={clearBackups}>
                                Clear backup history
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-lg font-semibold text-slate-900">Safe school admin</p>
                        <p className="mt-2 text-sm text-slate-600">These settings help keep notifications and backups consistent across your attendance workflow.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            <ShieldCheck className="h-4 w-4" /> Trusted workflow
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default SettingsPage;
