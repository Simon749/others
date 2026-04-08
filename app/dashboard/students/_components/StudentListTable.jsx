
import React, { useEffect, useState } from "react";
import { AllCommunityModule } from 'ag-grid-community';
import { AgGridProvider } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react';
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
} from "@/components/ui/alert-dialog"

const pagination = true;
const paginationPageSize = 10;
const paginationPageSelector = [25, 50, 100];


function StudentListTable({ studentList, refreshData }) {

    const CustomButtons = (props) => {
        return
        (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    < Button variant="destructive" > <Trash2Icon /></Button >
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your record
                            from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteRecord(props?.data?.id)}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )

    };

    const modules = [AllCommunityModule];
    const [colDefs, setColDefs] = useState([
        { headerName: "id", field: "id" },
        { headerName: "Name", field: "name" },
        { headerName: "Grade", field: "class" },
        { headerName: "Age", field: "age" },
        { headerName: "Actions", field: "actions", cellRenderer: CustomButtons }
    ]);

    const [rowData, setRowData] = useState([]);
    const [searchInput, setSearchInput] = useState();

    useEffect(() => {
        studentList && setRowData(studentList);
    }, [studentList]);

    const DeleteRecord = (id) => {

        GlodalApi.DeleteStudentRecord(id).then((res) => {
            if (res?.data) {
                toast("Record deleted successfully")
                refreshData()
            }
        })
    }
    return (
        <div className="my-7">
            <AgGridProvider modules={modules}>
                {/* Data Grid will fill the size of the parent container */}
                <div className="ag-theme-alpine" style={{ height: 500 }}>
                    <div className="p-2 rounded-lg border shadow-sm flex gap-2 mb-4 max-w-sm">
                        <Search />
                        <input type="text" placeholder="Search..."
                            className="outline-none w-full"
                            onChange={(event) => setSearchInput(event.target.value)}
                        />
                    </div>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={colDefs}
                        quickFilterText={searchInput}
                        pagination={pagination}
                        paginationPageSize={paginationPageSize}
                        paginationPageSelector={paginationPageSelector}
                    />
                </div>
            </AgGridProvider>
        </div>
    )
}

export default StudentListTable;