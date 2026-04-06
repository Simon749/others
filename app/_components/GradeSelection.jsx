"use clent"
import React, {useEffect, useState} from "react";
import GlobalApi from "@/app/_services/GlobalApi";

function GradeSelection({selectedGrade}) {
    const [grades, setGrades] = useState([]);

        useEffect(() => {
            GetAllGradesList();
        }, []);
    
    
        const GetAllGradesList = () => {
            // Call API to get all grades
            GlobalApi.GetAllGrades().then(resp => {
                setGrades(resp.data.results);
            });
        };
    return (
        <div>
            <select
                className="border rounded-lg p-2"
                onChange={(e)=>selectedGrade(e.target.value)}
                value={selectedGrade}
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
    )
}

export default GradeSelection;