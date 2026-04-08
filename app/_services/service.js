/**
     * used to filter out unique records based on studentId as there can be multiple records for a student in case of multiple attendance entries for different days
     * 
     * @returns 
     */

   export const getUniqueRecords = (attendance) => {
        const uniqueRecord = [];
        const existingUser = new Set();

        // Handle null, undefined, or non-array values
        if (!attendance || !Array.isArray(attendance)) {
            return uniqueRecord;
        }

        attendance.forEach(record => {
            if (!existingUser.has(record.studentId)) {
                existingUser.add(record.studentId);
                uniqueRecord.push(record);
            }
        });
        return uniqueRecord;
    }