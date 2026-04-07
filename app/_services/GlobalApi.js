const { default: axios } = require("axios");

const GetAllGrades = () => axios.get("/api/grade");
const CreateNewStudent = (data) => axios.post("/api/student", data);

const GetAllStudents = () => axios.get("/api/student");

const DeleteStudentRecord = (id) => axios.delete(`/api/student?id=`+id);

const GetAttendance = (grade, month) => axios.get(`/api/attendance?grade=`+grade+`&month=`+month);

const MarkAttendance = (data) => axios.post("/api/attendance", data);
const MarkAbsent = (studentId, day, date) => axios.delete(`/api/attendance?studentId=`+studentId+`&day=`+day+`&date=`+date);
export default {
    GetAllGrades,
    CreateNewStudent,
    GetAllStudents,
    DeleteStudentRecord,
    GetAttendance,
    MarkAttendance,
    MarkAbsent
}