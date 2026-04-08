"use client"
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import GlobalApi from "../../../_services/GlobalApi";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

function AddNewStudent({ refreshData}) {
    const [open, setOpen] = useState(false);
    const [grades, setGrades] = useState([]);
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [streamsLoading, setStreamsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            admissionNumber: "",
            fullName: "",
            gender: "",
            dateOfBirth: "",
            age: "",
            class: "",
            stream: ""
        }
    })

    // Watch the class field to fetch streams dynamically
    const selectedClass = watch("class");

    useEffect(() => {
        GetAllGradesList();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            GetStreamsByClass();
        } else {
            setStreams([]);
        }
    }, [selectedClass]);

    const GetAllGradesList = () => {
        // Call API to get all grades
        GlobalApi.GetAllGrades().then(resp => {
            setGrades(resp.data.results);
        });
    };

    const GetStreamsByClass = async () => {
        setStreamsLoading(true);
        try {
            // Fetch streams for the selected class
            const response = await fetch(`/api/streams?gradeId=${selectedClass}`);
            const data = await response.json();
            
            if (data.results) {
                setStreams(data.results);
            } else {
                setStreams([]);
            }
        } catch (error) {
            console.error("Error fetching streams:", error);
            setStreams([]);
        } finally {
            setStreamsLoading(false);
        }
    };

    const onSubmit = (data) => {
        setLoading(true);
        const nameParts = (data.fullName || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

        const studentPayload = {
            admissionNumber: data.admissionNumber,
            firstName,
            middleName,
            lastName,
            fullName: data.fullName,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            age: Number(data.age),
            class: data.class,
            stream: data.stream || null,
            admissionDate: data.admissionDate || new Date().toISOString(),
            previousSchool: data.previousSchool || null,
        };

        GlobalApi.CreateNewStudent(studentPayload)
            .then(resp => {
                console.log("Student created successfully", resp.data);
                reset();
                refreshData();
                setLoading(false);
                setOpen(false);
                toast("Student created successfully");
            })
            .catch(err => {
                console.error("Create student failed", err);
                toast("Failed to create student");
                setLoading(false);
            });
    };

    return (
        <div>
            <Button onClick={() => setOpen(true)}>+ Add New Student</Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="py-1">
                                    <label>Admission Number *</label>
                                    <input
                                        placeholder="Ex. ADM-2024-001"
                                        type="text"
                                        {...register("admissionNumber", { required: true })}
                                        className="w-full border rounded p-2"
                                    />
                                </div>

                            <div className="py-1">
                                <label>Student Name *</label>
                                <input
                                    placeholder="Ex. Kamau John Mwangi"
                                    type="text"
                                    {...register("fullName", { required: true })}
                                    className="w-full border rounded p-2"
                                />
                            </div>

                            <div className="py-3 grid grid-cols-2 gap-4">
                                <div>
                                    <label>Gender *</label>
                                    <select
                                        {...register("gender", { required: true })}
                                        className="w-full border rounded p-2"
                                    >
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Date of Birth *</label>
                                    <input
                                        type="date"
                                        {...register("dateOfBirth", { required: true })}
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                            </div>

                            <div className="py-3 grid grid-cols-2 gap-4">
                                <div>
                                    <label>Class *</label>
                                    <select
                                        {...register("class", { required: "Class is required" })}
                                        className="w-full border rounded p-2"
                                    >
                                        <option value="">Select Class</option>
                                        {grades.map((item, index) => (
                                            <option key={item.id || index} value={item.grade || item.id}>
                                                {item.grade || item.name || ""}
                                            </option>
                                        ))}
                                        <optgroup label="Primary (CBC)">
                                            <option value="grade_1">Grade 1</option>
                                            <option value="grade_2">Grade 2</option>
                                            <option value="grade_3">Grade 3</option>
                                            <option value="grade_4">Grade 4</option>
                                            <option value="grade_5">Grade 5</option>
                                            <option value="grade_6">Grade 6</option>
                                            <option value="grade_7">Grade 7</option>
                                            <option value="grade_8">Grade 8</option>
                                            <option value="grade_9">Grade 9</option>
                                        </optgroup>
                                        <optgroup label="Secondary">
                                            <option value="form_1">Form 1</option>
                                            <option value="form_2">Form 2</option>
                                            <option value="form_3">Form 3</option>
                                            <option value="form_4">Form 4</option>
                                        </optgroup>
                                    </select>
                                </div>
                                <div>
                                    <label>Stream</label>
                                    <select
                                        {...register("stream")}
                                        className="w-full border rounded p-2"
                                        disabled={!selectedClass || streamsLoading}
                                    >
                                        <option value="">Select Stream (Optional)</option>
                                        {streams && streams.length > 0 ? (
                                            streams.map((item, index) => (
                                                <option key={item.id || index} value={item.streamName}>
                                                    {item.description || `Stream ${item.streamName}`}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">No streams available for this class</option>
                                        )}
                                    </select>
                                    {streamsLoading && <span className="text-xs text-gray-500">Loading streams...</span>}
                                </div>
                            </div>

                            {/* Parent/Guardian Details */}
                            <h3 className="text-xl font-semibold mt-6 mb-3">Parent/Guardian Details</h3>

                            <div className="py-1">
                                <label>Parent/Guardian Name *</label>
                                <input
                                    placeholder="Ex. Mary Wanjiku Kamau"
                                    type="text"
                                    {...register("parentName", { required: true })}
                                    className="w-full border rounded p-2"
                                />
                            </div>

                            <div className="py-3 grid grid-cols-2 gap-4">
                                <div>
                                    <label>Phone Number 1 *</label>
                                    <input
                                        placeholder="0712345678"
                                        type="tel"
                                        {...register("phone1", { required: true, pattern: /0[79]\d{8}/ })}
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label>Phone Number 2</label>
                                    <input
                                        placeholder="0723456789"
                                        type="tel"
                                        {...register("phone2")}
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <h3 className="text-xl font-semibold mt-6 mb-3">Location</h3>

                            <div className="py-3 grid grid-cols-2 gap-4">
                                <div>
                                    <label>County *</label>
                                    <select {...register("county", { required: true })} className="w-full border rounded p-2">
                                        <option value="">Select County</option>
                                        <option value="nairobi">Nairobi</option>
                                        <option value="mombasa">Mombasa</option>
                                        <option value="kiambu">Kiambu</option>
                                        <option value="nakuru">Nakuru</option>
                                        <option value="kisumu">Kisumu</option>
                                        {/* Add all 47 counties */}
                                    </select>
                                </div>
                                <div>
                                    <label>Sub-County</label>
                                    <input placeholder="Ex. Westlands" type="text" {...register("subCounty")} className="w-full border rounded p-2" />
                                </div>
                            </div>

                            <div className="py-1">
                                <label>Village/Estates</label>
                                <input
                                    placeholder="Ex. Kawangware, Stage 3"
                                    type="text"
                                    {...register("village")}
                                    className="w-full border rounded p-2"
                                />
                            </div>

                            {/* Medical */}
                         { /*  <div className="py-1">
                                <label>Medical Conditions / Special Needs</label>
                                <textarea
                                    placeholder="Ex. Asthma, Diabetic"
                                    rows="2"
                                    className="w-full border rounded p-2"
                                />
                            </div> */}

                            {/* Submit */}
                            <div className="py-6 flex gap-4">
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2Icon className="animate-spin" /> : <Loader2Icon/>}
                                    Save Student
                                </button>
                                <button
                                    type="button"
                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                            </form>
                        
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AddNewStudent;