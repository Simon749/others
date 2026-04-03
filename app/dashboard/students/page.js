"use client"
import React, { useEffect, useState} from "react";
import AddNewStudent from "./_components/AddNewStudent";
import GlobalApi from "@/app/_services/GlobalApi";
import StudentListTable from "./_components/StudentListTable";



function Student() {

    const [studentList, setStudentList] = useState([]);

    useEffect(() => {
        GetAllStudents();
    }, []);

    /**
     * Used to Get All Students
     */

 
    const GetAllStudents = () => {
        GlobalApi.GetAllStudents().then((resp) => {
            setStudentList(resp.data);
        })
    }

    return (
        <div className="p-7">
            <h2 className="font-bold text-4xl flex justify-between items-center">
                Students
                <AddNewStudent />
            </h2>
            
            

            <StudentListTable studentList={studentList} />
            
        </div>
    )
}

export default Student;