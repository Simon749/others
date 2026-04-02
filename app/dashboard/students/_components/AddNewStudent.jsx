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

function AddNewStudent() {
    const [open, setOpen] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm()

    useEffect(() => {
        GetAllGradesList();
    }, []);


    const GetAllGradesList = () => {
        // Call API to get all grades
        GlabalApi.GetAllGrades().then(resp => {
            console.log(resp.data.results);
        });
    };

    const onSubmit = (data) => {
        console.log("FormData", data);
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
                                        required
                                        className="w-full border rounded p-2"
                                    />
                                </div>

                            <div className="py-1">
                                <label>Student Name *</label>
                                <input
                                    placeholder="Ex. Kamau John Mwangi"
                                    type="text"
                                    required
                                    className="w-full border rounded p-2"
                                />
                            </div>

                            <div className="py-3 grid grid-cols-2 gap-4">
                                <div>
                                    <label>Gender *</label>
                                    <select required className="w-full border rounded p-2">
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Date of Birth *</label>
                                    <input type="date" required className="w-full border rounded p-2" />
                                </div>
                            </div>

                            <div className="py-3 grid grid-cols-2 gap-4">
                                <div>
                                    <label>Class *</label>
                                    <select required className="w-full border rounded p-2">
                                        <option value="">Select Class</option>
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
                                    <select className="w-full border rounded p-2">
                                        <option value="">None</option>
                                        <option value="east">East</option>
                                        <option value="west">West</option>
                                        <option value="north">North</option>
                                        <option value="south">South</option>
                                    </select>
                                </div>
                            </div>

                            {/* Parent/Guardian Details */}
                            <h3 className="text-xl font-semibold mt-6 mb-3">Parent/Guardian Details</h3>

                            <div className="py-1">
                                <label>Parent/Guardian Name *</label>
                                <input
                                    placeholder="Ex. Mary Wanjiku Kamau"
                                    type="text"
                                    required
                                    className="w-full border rounded p-2"
                                />
                            </div>

                            <div className="py-3 grid grid-cols-2 gap-4">
                                <div>
                                    <label>Phone Number 1 *</label>
                                    <input
                                        placeholder="0712345678"
                                        type="tel"
                                        required
                                        pattern="0[79]\d{8}"
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label>Phone Number 2</label>
                                    <input
                                        placeholder="0723456789"
                                        type="tel"
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <h3 className="text-xl font-semibold mt-6 mb-3">Location</h3>

                            <div className="py-3 grid grid-cols-2 gap-4">
                                <div>
                                    <label>County *</label>
                                    <select required className="w-full border rounded p-2">
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
                                    <input placeholder="Ex. Westlands" type="text" className="w-full border rounded p-2" />
                                </div>
                            </div>

                            <div className="py-1">
                                <label>Village/Estates</label>
                                <input
                                    placeholder="Ex. Kawangware, Stage 3"
                                    type="text"
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
                                >
                                    Save Student
                                </button>
                                <button
                                    type="submit"
                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
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