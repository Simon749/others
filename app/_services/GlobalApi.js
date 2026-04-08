const { default: axios } = require("axios");

const GetAllGrades = () => axios.get("/api/grade");
const CreateNewStudent = (data) => axios.post("/api/student", data);

const GetAllStudents = () => axios.get("/api/student");

const DeleteStudentRecord = (id) => axios.delete(`/api/student?id=`+id);

const GetAttendance = (grade, month, stream) => {
    let url = `/api/attendance?grade=${grade}&month=${month}`;
    if (stream) {
        url += `&stream=${stream}`;
    }
    return axios.get(url);
};

const MarkAttendance = (data) => axios.post("/api/attendance", data);
const BulkMarkAttendance = (attendanceEntries) => axios.post("/api/attendance/bulk", attendanceEntries);
const GetAttendanceReport = (grade, month) => axios.get(`/api/attendance/report?grade=${grade}&month=${month}`);
const ExportAttendanceCsv = (grade, month) => axios.get(`/api/attendance/export?grade=${grade}&month=${month}`, { responseType: 'blob' });
const MarkAbsent = (studentId, day, date) => axios.delete(`/api/attendance?studentId=`+studentId+`&day=`+day+`&date=`+date);
const SendNotification = (payload) => axios.post("/api/notifications", payload);

const TotalPresentCountByDay = (grade, date) => axios.get(`/api/dashboard?grade=`+grade+`&date=`+date);
export default {
    GetAllGrades,
    CreateNewStudent,
    GetAllStudents,
    DeleteStudentRecord,
    GetAttendance,
    MarkAttendance,
    BulkMarkAttendance,
    GetAttendanceReport,
    ExportAttendanceCsv,
    MarkAbsent,
    SendNotification,
    TotalPresentCountByDay
}